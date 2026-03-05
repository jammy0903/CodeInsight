package com.vis;

import com.sun.jdi.*;
import com.sun.jdi.connect.Connector;
import com.sun.jdi.connect.LaunchingConnector;
import com.sun.jdi.connect.IllegalConnectorArgumentsException;
import com.sun.jdi.connect.VMStartException;
import com.sun.jdi.event.*;
import com.sun.jdi.request.ClassPrepareRequest;
import com.sun.jdi.request.EventRequest;
import com.sun.jdi.request.EventRequestManager;
import com.sun.jdi.request.MethodEntryRequest;
import com.sun.jdi.request.StepRequest;

import java.io.IOException;
import java.util.List;
import java.util.Map;

public class DebuggerAgent {

    private final String targetClassName;
    private VirtualMachine vm;
    private final SnapshotMaker snapshotMaker;
    private final JsonWriter jsonWriter;
    private int previousLine = -1;
    private ThreadReference previousThread = null;
    private final StringBuilder stdoutBuffer = new StringBuilder();

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

        // System.out.println / print 호출 인터셉트 (stdout 캡처용)
        MethodEntryRequest printReq = mgr.createMethodEntryRequest();
        printReq.addClassFilter("java.io.PrintStream");
        printReq.setSuspendPolicy(EventRequest.SUSPEND_EVENT_THREAD);
        printReq.enable();

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
                    // VM 종료 전 마지막 라인 출력
                    if (previousLine != -1 && previousThread != null) {
                        try {
                            Map<String, Object> snapshot = snapshotMaker.capture(previousThread, previousLine, stdoutBuffer.toString());
                            jsonWriter.print(snapshot);
                        } catch (Exception e) {
                            // VM이 이미 종료되었으면 무시
                        }
                    }
                    connected = false;
                    break;
                } else if (event instanceof ClassPrepareEvent) {
                    createStepRequest(vm, (ClassPrepareEvent) event);
                } else if (event instanceof MethodEntryEvent) {
                    captureStdout((MethodEntryEvent) event);
                } else if (event instanceof StepEvent) {
                    processStep((StepEvent) event);
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

    private void createStepRequest(VirtualMachine vm, ClassPrepareEvent event) throws AbsentInformationException {
        EventRequestManager mgr = vm.eventRequestManager();
        ThreadReference thread = event.thread();

        // Create a step request to execute line-by-line
        // STEP_LINE: step to the next line
        // STEP_INTO: step into method calls (not over them)
        StepRequest stepRequest = mgr.createStepRequest(
            thread,
            StepRequest.STEP_LINE,
            StepRequest.STEP_INTO
        );

        // Step into all user classes. Exclude JDK/internal frames to keep snapshots focused.
        stepRequest.addClassExclusionFilter("java.*");
        stepRequest.addClassExclusionFilter("javax.*");
        stepRequest.addClassExclusionFilter("jdk.*");
        stepRequest.addClassExclusionFilter("sun.*");
        stepRequest.addClassExclusionFilter("com.sun.*");
        stepRequest.addClassExclusionFilter("org.gradle.*");
        stepRequest.addClassExclusionFilter("kotlin.*");
        stepRequest.enable();

        vm.resume(); // Resume the VM to start stepping
    }

    private void processStep(StepEvent event) {
        ThreadReference thread = event.thread();
        int currentLine = event.location().lineNumber();

        try {
            // 스레드가 suspended 상태인지 확인 (defensive check)
            if (!thread.isSuspended()) {
                System.err.println("Warning: Thread not suspended at step, suspending now...");
                thread.suspend();
            }

            // StepEvent는 "다음 라인 진입 시점"에 발생
            // 따라서 이전 라인의 실행이 완료된 상태
            if (previousLine != -1 && previousThread != null) {
                // 이전 라인의 스냅샷 출력 (stdoutBuffer에 누적된 출력 포함)
                Map<String, Object> snapshot = snapshotMaker.capture(thread, previousLine, stdoutBuffer.toString());
                jsonWriter.print(snapshot);
            }

            // 현재 라인을 다음 스텝을 위해 저장
            previousLine = currentLine;
            previousThread = thread;

        } catch (VMDisconnectedException e) {
            // VM 종료 시 마지막 라인 출력
            if (previousLine != -1 && previousThread != null) {
                try {
                    Map<String, Object> snapshot = snapshotMaker.capture(previousThread, previousLine, stdoutBuffer.toString());
                    jsonWriter.print(snapshot);
                } catch (Exception ignored) {
                    // 이미 종료된 상태에서는 무시
                }
            }
        } catch (IncompatibleThreadStateException e) {
            // Race condition 발생 시 재시도
            System.err.println("Thread state incompatible, retrying after explicit suspend...");
            try {
                thread.suspend();
                if (previousLine != -1) {
                    Map<String, Object> snapshot = snapshotMaker.capture(thread, previousLine, stdoutBuffer.toString());
                    jsonWriter.print(snapshot);
                }
                previousLine = currentLine;
                previousThread = thread;
            } catch (VMDisconnectedException vme) {
                // VM이 이미 종료됨 - 정상적인 상황
            } catch (Exception retryException) {
                System.err.println("Retry failed: " + retryException.getMessage());
                retryException.printStackTrace(System.err);
            }
        } catch (Exception e) {
            System.err.println("Error processing step: " + e.getMessage());
            e.printStackTrace(System.err);
        }
    }

    /**
     * MethodEntryEvent에서 System.out.print / println 인자를 읽어 stdoutBuffer에 누적
     * VM이 메서드 진입 시점에 정지해 있으므로 인자를 정확히 읽을 수 있음
     */
    private void captureStdout(MethodEntryEvent event) {
        try {
            Method method = event.method();
            String methodName = method.name();

            if (!methodName.equals("println") && !methodName.equals("print")) return;

            ThreadReference thread = event.thread();
            StackFrame frame = thread.frame(0);

            // getArgumentValues()는 debug info 없이도 동작, 'this' 제외한 실제 파라미터만 반환
            List<Value> args = frame.getArgumentValues();

            String outputStr = "";
            if (!args.isEmpty()) {
                outputStr = jdiValueToString(args.get(0));
            }

            stdoutBuffer.append(outputStr);
            if (methodName.equals("println")) {
                stdoutBuffer.append("\n");
            }

        } catch (IncompatibleThreadStateException | InvalidStackFrameException e) {
            // 스텝 진행에 영향 없으므로 무시
        } catch (Exception e) {
            System.err.println("captureStdout warning: " + e.getMessage());
        }
    }

    /**
     * JDI Value → 문자열 변환 (println 오버로드 전체 대응)
     */
    private String jdiValueToString(Value val) {
        if (val == null) return "null";
        if (val instanceof StringReference)  return ((StringReference) val).value();
        if (val instanceof IntegerValue)     return String.valueOf(((IntegerValue) val).value());
        if (val instanceof LongValue)        return String.valueOf(((LongValue) val).value());
        if (val instanceof DoubleValue)      return String.valueOf(((DoubleValue) val).value());
        if (val instanceof FloatValue)       return String.valueOf(((FloatValue) val).value());
        if (val instanceof BooleanValue)     return String.valueOf(((BooleanValue) val).value());
        if (val instanceof CharValue)        return String.valueOf(((CharValue) val).value());
        if (val instanceof ShortValue)       return String.valueOf(((ShortValue) val).value());
        if (val instanceof ByteValue)        return String.valueOf(((ByteValue) val).value());
        // ObjectReference: ClassName@address 형태로 표기 (교육용으로 충분)
        return val.toString();
    }
}
