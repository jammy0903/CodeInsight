package com.vis;

import com.sun.jdi.*;
import com.sun.jdi.connect.Connector;
import com.sun.jdi.connect.LaunchingConnector;
import com.sun.jdi.connect.IllegalConnectorArgumentsException;
import com.sun.jdi.connect.VMStartException;
import com.sun.jdi.event.*;
import com.sun.jdi.request.BreakpointRequest;
import com.sun.jdi.request.ClassPrepareRequest;
import com.sun.jdi.request.EventRequestManager;

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
            // Print a more informative error to stderr for the Node.js parent process
            System.err.println("DebuggerAgent failed: " + e.getMessage());
            e.printStackTrace(System.err);
            System.exit(1);
        }
    }

    public void run() throws Exception {
        vm = launchTarget(targetClassName);
        EventRequestManager mgr = vm.eventRequestManager();
        
        ClassPrepareRequest cpr = mgr.createClassPrepareRequest();
        cpr.addClassFilter(targetClassName);
        cpr.enable();

        mgr.createExceptionRequest(null, true, true).enable();

        eventLoop(vm);
    }

    private VirtualMachine launchTarget(String mainClass) throws IOException, IllegalConnectorArgumentsException, VMStartException {
        LaunchingConnector connector = Bootstrap.virtualMachineManager().defaultConnector();
        Map<String, Connector.Argument> arguments = connector.defaultArguments();
        
        arguments.get("main").setValue(mainClass);
        arguments.get("suspend").setValue("true");
        return connector.launch(arguments);
    }

    private void eventLoop(VirtualMachine vm) throws InterruptedException, AbsentInformationException {
        EventQueue eventQueue = vm.eventQueue();

        boolean connected = true;
        while (connected) {
            EventSet eventSet = eventQueue.remove();
            for (Event event : eventSet) {
                if (event instanceof VMDeathEvent || event instanceof VMDisconnectEvent) {
                    connected = false;
                    break;
                } else if (event instanceof ClassPrepareEvent) {
                    createBreakpointRequests(vm, (ClassPrepareEvent) event);
                } else if (event instanceof BreakpointEvent) {
                    processBreakpoint((BreakpointEvent) event);
                } else if (event instanceof ExceptionEvent) {
                    ExceptionEvent exceptionEvent = (ExceptionEvent) event;
                    // Print full stack trace for better diagnostics
                    System.err.println("Exception in target VM: " + exceptionEvent.exception());
                    try {
                        ThreadReference thread = exceptionEvent.thread();
                        // VM이 이미 종료되었을 수 있으므로 try-catch로 감쌈
                        if (thread.isSuspended()) {
                            for (StackFrame frame : thread.frames()) {
                                System.err.println("    at " + frame.location());
                            }
                        }
                    } catch (VMDisconnectedException e) {
                        // VM이 이미 종료됨 - 정상적인 상황
                        System.err.println("    (VM already disconnected)");
                    } catch (IncompatibleThreadStateException e) {
                        System.err.println("    (Could not get stack trace: " + e.getMessage() + ")");
                    }
                    connected = false;
                }
            }
            if (connected) {
                eventSet.resume();
            }
        }
    }

    private void createBreakpointRequests(VirtualMachine vm, ClassPrepareEvent event) throws AbsentInformationException {
        EventRequestManager mgr = vm.eventRequestManager();
        ReferenceType refType = event.referenceType();

        // Set a breakpoint at every executable line
        for (Location loc : refType.allLineLocations()) {
            if (loc.lineNumber() != -1) { // Only valid lines
                BreakpointRequest req = mgr.createBreakpointRequest(loc);
                req.enable();
            }
        }

        vm.resume(); // Resume the VM after setting breakpoints
    }

    private void processBreakpoint(BreakpointEvent event) {
        ThreadReference thread = event.thread();

        try {
            // 스레드가 suspended 상태인지 확인 (defensive check)
            if (!thread.isSuspended()) {
                System.err.println("Warning: Thread not suspended at breakpoint, suspending now...");
                thread.suspend();
            }

            Map<String, Object> snapshot = snapshotMaker.capture(thread, event.location().lineNumber());
            jsonWriter.print(snapshot);

        } catch (VMDisconnectedException e) {
            // VM이 이미 종료됨 - 정상적인 상황 (프로그램 종료 시 발생)
            // 마지막 breakpoint 처리 중 VM이 종료될 수 있음
        } catch (IncompatibleThreadStateException e) {
            // Race condition 발생 시 재시도
            System.err.println("Thread state incompatible, retrying after explicit suspend...");
            try {
                thread.suspend();
                Map<String, Object> snapshot = snapshotMaker.capture(thread, event.location().lineNumber());
                jsonWriter.print(snapshot);
            } catch (VMDisconnectedException vme) {
                // VM이 이미 종료됨 - 정상적인 상황
            } catch (Exception retryException) {
                System.err.println("Retry failed: " + retryException.getMessage());
                retryException.printStackTrace(System.err);
            }
        } catch (Exception e) {
            System.err.println("Error processing breakpoint: " + e.getMessage());
            e.printStackTrace(System.err);
        }
    }
}
