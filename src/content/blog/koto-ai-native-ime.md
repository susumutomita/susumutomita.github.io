---
title: "Koto: A Local-First AI Native IME for Context-Aware Intent-to-Text Transformation"
description: "「あれやっといて」を、次の入力候補に変える AI Native IME。ローカル作業文脈を用いた文脈対応型 Intent-to-Text IME の position paper。"
pubDate: 2026-06-11
category: "ai,research,ime"
---

# Koto: A Local-First AI Native IME for Context-Aware Intent-to-Text Transformation

**Koto: ローカル作業文脈を用いた文脈対応型 Intent-to-Text IME**

**Author**: Susumu Tomita

> 「あれやっといて」を、次の入力候補に変える AI Native IME。
>
> A local-first AI Native IME that turns rough intent into context-aware input candidates.

- Repository: [github.com/susumutomita/koto-input](https://github.com/susumutomita/koto-input)
- Design discussion: koto-input Issue #43 — local context memory for context-aware intent suggestions

## Abstract

Traditional input method editors (IMEs) transform phonetic readings into text. They do not understand what the user is trying to do. As people increasingly work alongside AI agents, the gap between vague human intent and the structured input those agents need keeps widening. Koto is a local-first, AI Native IME that closes this gap by treating the IME not as a reading-to-text converter but as an intent-to-text transformer. Using working context accumulated locally on the user's own device, Koto turns rough intent such as `あれやっといて` into the next concrete input candidate. Crucially, Koto follows a `Suggest, not act` principle: it proposes the next input under the user's control and never executes actions on the user's behalf. This position paper defines the AI Native IME category, formalizes Intent-to-Text Transformation, describes the local context memory and the deterministic/AI/preset layering of the system, and outlines a prototype and evaluation plan.

## 概要（日本語）

従来の IME は読みを文字に変換するものであり、ユーザが何をしようとしているのかは理解しない。人が AI エージェントと協働する場面が増えるにつれて、曖昧な人間の意図と、エージェントが必要とする構造化された入力との間の隔たりは広がり続けている。Koto は、この隔たりを埋めるローカルファーストな AI Native IME である。Koto は IME を「読み→文字」の変換器ではなく「意図→文字」の変換器として捉え直す。端末上にローカルに蓄積された作業文脈を用いて、`あれやっといて` のような曖昧な意図を、次の具体的な入力候補へと変換する。重要なのは、Koto が `Suggest, not act`（提案はするが実行はしない）の原則に従う点である。Koto はユーザの制御下で次の入力を提案するのみであり、ユーザに代わって行動を実行することはない。

本ポジションペーパーでは、AI Native IME というカテゴリを定義し、Intent-to-Text Transformation を定式化し、ローカル作業記憶と、確定変換層・AI 提案層・アプリ対応プリセット層からなるシステム構成を述べ、プロトタイプと評価の計画を示す。

## 1. Introduction

People rarely think in finished sentences. They think in intent: "do that thing from this morning", "reply to her", "あれやっといて". Existing IMEs require the user to translate that intent into a reading, and then into text, entirely in their own head. The IME only helps with the last, mechanical step.

Meanwhile, AI agents are good at acting on structured instructions but poor at recovering the missing context behind a vague request. Koto sits exactly at this boundary. It is an IME — it stays in the normal typing loop, on every app — but it is **AI Native**: it uses locally accumulated working context to suggest the next input that expresses the user's intent.

## 2. Background and related work

- **IME / predictive text.** Conventional reading-to-text conversion and n-gram / neural predictive text complete words and phrases, but operate on surface form, not intent.
- **Intent recognition.** Dialogue and assistant systems classify intent, but typically to trigger an action, not to produce an editable text candidate.
- **Context-aware recommendation.** Recommenders use behavioral context, usually server-side and across users, rather than a single user's private working memory.
- **Local-first personalization.** Local-first software keeps data on device and gives the user ownership; Koto applies this stance to input.
- **Agent interfaces.** Agent UIs increasingly accept natural language, which makes the quality of the user's *input* the new bottleneck.

## 3. Problem statement

1. Existing IMEs transform readings into text; they have no model of the task.
2. AI agents require structured intent, which users seldom provide directly.
3. Users naturally express work as vague intent ("あれ", "それ", "いつものやつ").

The result is a translation burden carried entirely by the user. Koto reframes the IME as the place to relieve that burden.

## 4. Design concept

- **AI Native IME.** The IME is redefined as an intent-to-text transformer that stays inside the normal input loop.
- **Context-aware input candidates.** Candidates are generated from the user's recent working context, not only the current reading.
- **Local working memory.** Context is accumulated and stored locally, under user control.
- **User-controlled execution.** Koto suggests; the user decides. It never auto-acts.

### Why existing IMEs are not enough

A traditional IME given `あれやっといて` can only convert the reading. It cannot know what "あれ" refers to. Koto, holding local working context, can propose a concrete next input — for example, a drafted message, a command, or a structured instruction — that the user can accept, edit, or reject.

### Intent-to-Text Transformation (definition)

> Intent-to-Text Transformation is the mapping from an under-specified expression of intent, plus locally held working context, to a concrete, editable text candidate that the user can accept under their own control.

This is distinct from reading-to-text (no intent, no context) and from agent execution (acts on the user's behalf).

## 5. System design

- **Deterministic conversion layer.** Guarantees normal IME behavior: readings convert to text reliably, with zero regression for ordinary typing.
- **AI suggestion layer.** Produces intent-to-text candidates from working context; always optional and always editable.
- **Local memory layer.** Stores recent working context (documents, tasks, recent edits) on device, owned by the user.
- **App-aware preset layer.** Adapts candidates to the active application (chat, editor, terminal, ticketing), so the same intent yields app-appropriate text.

### The `Suggest, not act` principle

Koto draws a hard line between proposing input and performing actions.

- Traditional IME: reading → text.
- Koto: intent → next input candidate (suggested, editable, user-confirmed).
- Traditional assistant: acts on behalf of the user.
- Koto: never acts; it only suggests the next input under user control.

This distinction is core to Koto's branding, research positioning, and safety story.

## 6. Prototype plan

A first prototype targets a single platform and a small set of app presets. It wires the deterministic layer (so normal typing is unaffected), a local memory of recent working context, and an AI suggestion layer that proposes intent-to-text candidates surfaced as ordinary IME candidates. The user accepts with the same keystrokes they already use.

## 7. Evaluation plan

- **Latency.** Suggestions must appear within an interactive budget.
- **Candidate quality.** Relevance and usefulness of intent-to-text candidates.
- **Acceptance rate.** How often users accept a suggested candidate.
- **Privacy perception.** Whether users trust a local-first design with working context.
- **Normal IME regression.** Ordinary reading-to-text typing must not degrade.

## 8. Discussion

Koto's bet is that the IME — not a separate assistant window — is the right surface for intent-to-text, because it is already where text is born, on every application, in the user's own hands. Keeping context local makes this acceptable to use for real work.

## 9. Limitations

- Quality depends on the richness and recency of local working context.
- Some apps expose little structure for the preset layer to exploit.
- Intent is inherently ambiguous; suggestions will sometimes be wrong, which is why they remain suggestions.

## 10. Future work

- Richer, privacy-preserving local memory.
- More app presets and structured-instruction targets for agent workflows.
- Studies on long-term acceptance and trust.

## 11. Conclusion

Koto reframes the IME from reading-to-text to intent-to-text. By using locally accumulated working context and following a strict `Suggest, not act` principle, it turns rough intent such as `あれやっといて` into the next input candidate — under the user's control. This makes a new product category legible: not another Japanese IME, but an AI Native IME for context-aware intent-to-text transformation.

---

*Source and ongoing design: [github.com/susumutomita/koto-input](https://github.com/susumutomita/koto-input).*
