---
status: active
owner_mode: goal
objective: "Improve this project through bounded, verified goal segments."
updated_at: 2026-09-02T18:37:25+08:00
adapter_id: palantir-ontology-research-goal
---

# Active Goal State

## Objective

Improve this project through bounded, verified goal segments.

## Authority Sources

- No explicit goal document was provided during bootstrap.

## Operating Contract

- Treat this file as the durable goal state for future agent ticks.
- Treat the authority sources above as the first context to inspect before acting.
- Read current project evidence before choosing the next action.
- Run a bounded progress segment when useful; it does not have to be one tiny step.
- Keep private evidence, credentials, local paths, and raw logs out of public commits.
- End each tick with changed files, validation, residual risk, and the next action.

## Execution Profile

- `cadence=bounded_progress_segment minimum=multi_surface_or_implementation include=coherent_artifact,targeted_validation,state_writeback spend_rule=spend_only_after_artifact_validation_writeback small_streak_threshold=2`
- Repeated small-scale follow-through should expand the next delivery batch or report a blocker before spending quota.

## Non-Goals

- Do not perform irreversible production operations without explicit approval.
- Do not publish private project evidence.
- Do not optimize for activity if no useful artifact or decision can be produced.


## User Todo / Owner Review Reading Queue

## Agent Todo

- [ ] [P1] Run `loopx check` against the project registry and record the first project-specific adapter signal or an explicit no-follow-up rationale.
  <!-- loopx:todo todo_id=todo_fa501099a20c status=open task_class=advancement_task action_kind=onboarding_connection_validation updated_at=2026-09-02T17:18:20%2B08:00 -->
- [ ] [P0] 第一节：研究 AI 本体论核心概念——本体的定义、五大核心要素、与分类法/知识图谱/语义层/上下文图谱的辨析、Agent 时代本体论的复兴（教材/讲义素材）
  <!-- loopx:todo todo_id=todo_5a4d90b62607 status=open task_class=advancement_task action_kind=research claimed_by=research-agent-1 target_key=section1 updated_at=2026-09-02T18:33:39%2B08:00 -->
- [ ] [P0] 第二节：研究共享模型——定义、语义漂移治理、多 Agent 协同中的契约价值、构建路径与维护机制（教材/讲义素材）
  <!-- loopx:todo todo_id=todo_59d9812c6a8f status=open task_class=advancement_task action_kind=research claimed_by=research-agent-1 target_key=section2 updated_at=2026-09-02T18:34:19%2B08:00 -->
- [ ] [P0] 第三节：研究 Palantir Ontology 设计实战——Ontology 定位、三大基本原语（对象/链接/动作）、AIP Agent 四层交互架构、设计原则、反模式、设计纪律（教材/讲义素材）
  <!-- loopx:todo todo_id=todo_9055aa911254 status=open task_class=advancement_task action_kind=research claimed_by=research-agent-1 target_key=section3 updated_at=2026-09-02T18:35:43%2B08:00 -->
- [ ] [P0] 第四节：研究实施落地——Onyx 医疗制造商原料短缺全流程推演、行业案例、本体成熟度评估五维指标、风险挑战、我的落地三步走（教材/讲义素材）
  <!-- loopx:todo todo_id=todo_3ab24a71dbcf status=open task_class=advancement_task action_kind=research claimed_by=research-agent-1 target_key=section4 updated_at=2026-09-02T18:36:26%2B08:00 -->
- [ ] [P1] 教材汇编：将四节研究素材整合为完整教材文档（含讲师手册、PPT 大纲、案例库、练习题、参考文献）
  <!-- loopx:todo todo_id=todo_9d97e6f1a81c status=open task_class=advancement_task action_kind=synthesis claimed_by=research-agent-1 target_key=textbook-assembly updated_at=2026-09-02T18:37:25%2B08:00 -->

## Next Action

- [P1] Run `loopx check` against the project registry and record the first project-specific adapter signal or an explicit no-follow-up rationale.
<!-- loopx:next-action schema=loopx_next_action_binding_v0 todo_id=todo_fa501099a20c -->

## Recent User Feedback

- Initialized by `loopx bootstrap`.

## Progress Ledger

- Created the initial goal state and registry connection.
