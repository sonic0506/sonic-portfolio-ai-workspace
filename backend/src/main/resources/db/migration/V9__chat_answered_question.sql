-- ADR-0022: answered questions are kept too (status ANSWERED, no reason) for 7 days (configurable).
alter table chat_unanswered_question alter column reason drop not null;
alter table chat_unanswered_question drop constraint chat_unanswered_question_status_check;
alter table chat_unanswered_question add constraint chat_unanswered_question_status_check
  check (status in ('OPEN', 'RESOLVED', 'IGNORED', 'ANSWERED'));
