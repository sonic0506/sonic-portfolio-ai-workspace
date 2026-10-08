package dev.portfolio.portfolio_api.skill;

public record SkillResponse(Long id, String code, String name, String iconKey, String iconUrl) {

    public static SkillResponse from(Skill skill) {
        return new SkillResponse(skill.getId(), skill.getCode(), skill.getName(), skill.getIconKey(), skill.getIconUrl());
    }
}
