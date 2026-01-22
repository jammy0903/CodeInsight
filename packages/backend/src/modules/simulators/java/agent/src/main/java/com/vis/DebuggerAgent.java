package com.vis;

import com.sun.jdi.*;
import com.sun.jdi.connect.Connector;
import com.sun.jdi.connect.LaunchingConnector;
import com.sun.jdi.connect.IllegalConnectorArgumentsException;
import com.sun.jdi.connect.VMStartException;
import com.sun.jdi.event.*;
import com.sun.jdi.request.ClassPrepareRequest;
import com.sun.jdi.request.EventRequestManager;
import com.sun.jdi.request.StepRequest;

import java.io.IOException;
import java.util.Map;

public class DebuggerAgent {

    private final String targetClassName;
    private VirtualMachine vm;
    private final SnapshotMaker snapshotMaker;
    private final JsonWriter jsonWriter;

    public DebuggerAgent(String targetClassName) {
        this.targetClassName = targetClassName;
        this.snapshotMaker = new SnapshotMaker();
        this.jsonWriter = new JsonWriter();
    }

    public static void main(String[] args) {
        if (args.length < 1) {
            System.err.println("Usage: java -jar debugger-agent.jar <TargetClassName>");
            System.exit(1);
        }

        try {
            new DebuggerAgent(args[0]).run();
        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }

    public void run() throws Exception {
        vm = launchTarget(targetClassName);

        EventRequestManager mgr = vm.eventRequestManager();
        ClassPrepareRequest cpr = mgr.createClassPrepareRequest();
        cpr.addClassFilter(targetClassName);
        cpr.enable();

        eventLoop(vm);
    }

    private VirtualMachine launchTarget(String mainClass) throws IOException, IllegalConnectorArgumentsException, VMStartException {
        LaunchingConnector connector = Bootstrap.virtualMachineManager().defaultConnector();
        Map<String, Connector.Argument> arguments = connector.defaultArguments();
        
        arguments.get("main").setValue(mainClass);
        return connector.launch(arguments);
    }

    private void eventLoop(VirtualMachine vm) throws InterruptedException {
        EventQueue eventQueue = vm.eventQueue();
        vm.resume(); 

        boolean connected = true;
        while (connected) {
            EventSet eventSet = eventQueue.remove();
            for (Event event : eventSet) {
                if (event instanceof VMDeathEvent || event instanceof VMDisconnectEvent) {
                    connected = false;
                } else if (event instanceof ClassPrepareEvent) {
                    createStepRequest(vm, (ClassPrepareEvent) event);
                } else if (event instanceof StepEvent) {
                    processStep((StepEvent) event);
                }
            }
            if (connected) {
                eventSet.resume();
            }
        }
    }

    private void createStepRequest(VirtualMachine vm, ClassPrepareEvent event) {
        EventRequestManager mgr = vm.eventRequestManager();
        ThreadReference thread = event.thread();

        StepRequest stepReq = mgr.createStepRequest(thread, StepRequest.STEP_LINE, StepRequest.STEP_INTO);
        
        stepReq.addClassExclusionFilter("java.*");
        stepReq.addClassExclusionFilter("javax.*");
        stepReq.addClassExclusionFilter("sun.*");
        stepReq.addClassExclusionFilter("jdk.*");
        
        stepReq.enable();
    }

    private void processStep(StepEvent event) {
        try {
            Map<String, Object> snapshot = snapshotMaker.capture(event.thread(), event.location().lineNumber());
            jsonWriter.print(snapshot);
        } catch (Exception e) {
            System.err.println("Error processing step: " + e.getMessage());
        }
    }
}
