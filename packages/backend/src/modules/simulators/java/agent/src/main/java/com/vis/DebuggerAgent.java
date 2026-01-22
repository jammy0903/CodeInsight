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
            // 에이전트 실행
            new DebuggerAgent(args[0]).run();
        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }

    public void run() throws Exception {
        // 1. 사용자의 코드를 실행할 타겟 JVM 시작 (Launch)
        vm = launchTarget(targetClassName);

        // 2. 이벤트 요청 설정: "메인 클래스가 로딩(Prepare)되면 알려달라"
        EventRequestManager mgr = vm.eventRequestManager();
        ClassPrepareRequest cpr = mgr.createClassPrepareRequest();
        cpr.addClassFilter(targetClassName);
        cpr.enable();

        // 3. 이벤트 루프 시작 (Node.js가 종료시킬 때까지 계속 돔)
        eventLoop(vm);
    }

    private VirtualMachine launchTarget(String mainClass) throws IOException, IllegalConnectorArgumentsException, VMStartException {
        LaunchingConnector connector = Bootstrap.virtualMachineManager().defaultConnector();
        Map<String, Connector.Argument> arguments = connector.defaultArguments();
        
        // 실행할 메인 클래스 이름 설정
        arguments.get("main").setValue(mainClass);
        // suspend=true가 기본값이므로, 실행 직후 VM은 멈춰있는 상태임
        return connector.launch(arguments);
    }

    private void eventLoop(VirtualMachine vm) throws InterruptedException {
        EventQueue eventQueue = vm.eventQueue();
        vm.resume(); // 멈춰있던 VM 실행 재개

        boolean connected = true;
        while (connected) {
            EventSet eventSet = eventQueue.remove(); // 이벤트 대기
            for (Event event : eventSet) {
                if (event instanceof VMDeathEvent || event instanceof VMDisconnectEvent) {
                    connected = false;
                } else if (event instanceof ClassPrepareEvent) {
                    // 클래스 로딩 완료 -> 이제부터 한 줄씩 실행(Step) 시작
                    createStepRequest(vm, (ClassPrepareEvent) event);
                } else if (event instanceof StepEvent) {
                    // 한 줄 실행됨 -> 현재 상태(Stack/Heap) 스냅샷 찍기
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

        // STEP_LINE: 한 줄 단위 실행
        // STEP_INTO: 메소드 호출 시 안으로 진입 (스택 쌓이는 것 보여주기 위함)
        StepRequest stepReq = mgr.createStepRequest(thread, StepRequest.STEP_LINE, StepRequest.STEP_INTO);
        
        // Java 내부 라이브러리는 스킵하고 사용자 코드만 추적 (필터링)
        stepReq.addClassExclusionFilter("java.*");
        stepReq.addClassExclusionFilter("javax.*");
        stepReq.addClassExclusionFilter("sun.*");
        stepReq.addClassExclusionFilter("jdk.*");
        
        stepReq.enable();
    }

    private void processStep(StepEvent event) {
        try {
            // 1. 현재 스레드의 스택/힙 상태 추출
            Map<String, Object> snapshot = snapshotMaker.capture(event.thread(), event.location().lineNumber());
            
            // 2. JSON으로 변환하여 표준 출력(StdOut)으로 전송 -> Node.js가 읽음
            jsonWriter.print(snapshot);
            
        } catch (Exception e) {
            // 에러 발생 시 StdErr로 출력 (Node.js가 로그 수집)
            System.err.println("Error processing step: " + e.getMessage());
        }
    }
}