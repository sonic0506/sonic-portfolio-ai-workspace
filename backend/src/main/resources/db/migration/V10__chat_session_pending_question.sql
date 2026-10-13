-- ADR-0024: the first question is stored with the session and run once from /chat/{id},
-- so it survives a full-page navigation. pending_question is cleared when claimed.
-- focus_* (ADR-0023) stays for the whole session: follow-ups keep the focused document as evidence.
alter table chat_session add column pending_question text;
alter table chat_session add column focus_type text;
alter table chat_session add column focus_slug text;
