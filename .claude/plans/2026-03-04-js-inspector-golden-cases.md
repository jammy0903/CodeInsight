# JS Inspector Golden Cases (Draft)

목적: Inspector 전환 시 정확도 회귀를 검증할 최소 케이스 세트.

## A. Syntax / Runtime
- [ ] syntax_error_missing_brace
- [ ] runtime_reference_error
- [ ] runtime_type_error
- [ ] throw_custom_error_try_catch

## B. Variables / Scope
- [ ] var_hoisting_basic
- [ ] let_tdz_access
- [ ] const_reassign_error
- [ ] block_scope_shadowing
- [ ] closure_captures_outer

## C. Functions / Call Stack
- [ ] function_declaration_call
- [ ] function_expression_call
- [ ] arrow_function_call
- [ ] recursion_factorial
- [ ] return_early

## D. Object / Array / Reference
- [ ] object_property_assign
- [ ] nested_object_mutation
- [ ] array_push_pop_splice
- [ ] shared_reference_mutation
- [ ] circular_reference_safe

## E. Control Flow
- [ ] if_else_branch
- [ ] for_loop_increment
- [ ] while_loop_break
- [ ] switch_case_fallthrough
- [ ] try_catch_finally_order

## F. Class / Prototype / this
- [ ] class_constructor_method
- [ ] class_static_method
- [ ] prototype_method_override
- [ ] this_binding_method_call
- [ ] call_apply_bind_cases

## G. Async / Event Loop
- [ ] promise_then_chain_order
- [ ] async_await_sequence
- [ ] promise_all_basic
- [ ] setTimeout_order
- [ ] microtask_vs_macrotask_order

## H. Output / Limits / Safety
- [ ] console_log_multiple_args
- [ ] long_string_truncation
- [ ] large_array_truncation
- [ ] max_steps_exceeded
- [ ] timeout_infinite_loop

## 비교 규칙
- line sequence 정확히 비교 (필수)
- stdout 동일 비교 (필수)
- error code/message 비교 (필수)
- stack push/pop 순서 비교 (필수)
- heap는 구조/참조 일관성 비교 (허용 오차 일부 가능)

