# Prompt Engineering Guide

## Overview

This document defines the structured prompt engineering approach for AI-assisted storyboarding. All AI operations follow strict principles: **suggest, never decide; label confidence; be reversible**.

## Core Principles

1. **Structured Prompts**: Never use free-form prompts alone
2. **Context Scoping**: Isolate context per scene to avoid cross-contamination
3. **Explicit Constraints**: Encode cinematic rules and style constraints explicitly
4. **Confidence Scoring**: All AI outputs include confidence scores
5. **Reversibility**: All operations can be undone without data loss

## Prompt Structure

### Standard Prompt Template

```json
{
  "system_context": "You are a professional storyboard assistant...",
  "scene_context": {
    "scene_number": 1,
    "scene_text": "...",
    "previous_shots": [...],
    "style_constraints": {...}
  },
  "task": "generate_panel | suggest_shots | refine_panel",
  "parameters": {
    "shot_description": "...",
    "style": "anime | live-action | noir | ...",
    "character_references": [...],
    "environment_references": [...]
  },
  "constraints": {
    "max_iterations": 3,
    "confidence_threshold": 0.7,
    "preserve_consistency": true
  }
}
```

## Task-Specific Prompts

### 1. Script → Shot Suggestions

**Purpose**: Analyze scene text and suggest shot breakdown

**Prompt Structure**:
```
You are a professional cinematographer analyzing a scene for storyboarding.

SCENE CONTEXT:
Scene Number: {scene_number}
Scene Text: {scene_text}

PREVIOUS SHOTS IN SCENE:
{previous_shots_json}

TASK:
Analyze the scene and suggest a shot breakdown. For each suggested shot, provide:
- Shot number (sequential)
- Shot type (CU, MS, WS, ELS, etc.)
- Camera angle (Eye Level, High Angle, Low Angle, etc.)
- Camera movement (Static, Pan, Dolly, etc.) [optional]
- Brief description of what the shot should show

CONSTRAINTS:
- Suggest 1-5 shots per scene
- Maintain logical shot progression
- Consider pacing and visual storytelling
- Do not invent narrative elements not in the scene text

OUTPUT FORMAT (JSON):
{
  "suggestions": [
    {
      "shot_number": 1,
      "shot_type": "WS",
      "camera_angle": "Eye Level",
      "camera_movement": "Static",
      "description": "...",
      "confidence": 0.85
    }
  ],
  "overall_confidence": 0.85,
  "reasoning": "Brief explanation of shot choices"
}
```

### 2. Shot Description → Panel Generation

**Purpose**: Generate visual panel from shot description with style consistency

**Prompt Structure**:
```
You are a professional storyboard artist generating a visual panel.

SHOT CONTEXT:
Shot Number: {shot_number}
Shot Description: {shot_description}
Shot Type: {shot_type}
Camera Angle: {camera_angle}

STYLE CONSTRAINTS:
Style: {style} (anime, live-action, noir, etc.)
Color Palette: {color_palette} [if specified]
Visual Tone: {visual_tone}

CHARACTER CONSISTENCY:
{character_references_json}

ENVIRONMENT CONSISTENCY:
{environment_references_json}

TASK:
Generate a storyboard panel image that:
1. Accurately represents the shot description
2. Maintains style consistency with specified style
3. Preserves character appearance from references
4. Maintains environment continuity from references
5. Uses appropriate camera framing for shot type and angle

CONSTRAINTS:
- Draft quality is acceptable (rough visuals)
- Focus on clarity of intent over polish
- Maintain visual consistency with previous panels
- Do not add elements not in the shot description

OUTPUT:
Generate image with these parameters:
- Aspect Ratio: 16:9 (standard storyboard)
- Style: {style}
- Quality: Draft/Storyboard quality
- Include shot number overlay: {shot_number}
```

**Image Generation Parameters**:
```json
{
  "prompt": "Storyboard panel: {shot_description}. Style: {style}. Shot type: {shot_type}, Camera angle: {camera_angle}. Character references: {character_refs}. Environment: {env_refs}",
  "negative_prompt": "high detail, photorealistic, polished, final render, animation",
  "style": "{style}",
  "aspect_ratio": "16:9",
  "quality": "draft",
  "seed": "{seed_for_consistency}"
}
```

### 3. Panel Refinement

**Purpose**: Refine existing panel based on user feedback

**Prompt Structure**:
```
You are refining a storyboard panel based on director feedback.

ORIGINAL PANEL:
Panel ID: {panel_id}
Version: {version}
Original Description: {original_description}
Current Image: {image_url}

REFINEMENT REQUEST:
{refinement_prompt}

STYLE REFERENCE:
Previous panel (for consistency): {style_reference_id}

TASK:
Generate a refined version of the panel that:
1. Addresses the refinement request
2. Maintains style consistency with original
3. Preserves character and environment continuity
4. Keeps the same shot framing and composition intent

CONSTRAINTS:
- Do not change elements not mentioned in refinement
- Maintain visual consistency with previous version
- Preserve shot type and camera angle
- Increment version number

OUTPUT:
Generate refined image maintaining all consistency constraints.
```

## Style Constraints

### Anime Style
```json
{
  "style": "anime",
  "characteristics": [
    "Simplified character designs",
    "Expressive eyes and features",
    "Dynamic camera angles",
    "Clear panel composition",
    "Manga-inspired framing"
  ],
  "color_palette": "Vibrant, high contrast",
  "line_art": "Clean, defined lines"
}
```

### Live-Action Style
```json
{
  "style": "live-action",
  "characteristics": [
    "Realistic proportions",
    "Natural lighting",
    "Cinematic framing",
    "Production-ready composition"
  ],
  "color_palette": "Natural, film-like",
  "reference_style": "Professional storyboard sketches"
}
```

### Noir Style
```json
{
  "style": "noir",
  "characteristics": [
    "High contrast lighting",
    "Shadow play",
    "Dramatic angles",
    "Monochrome or desaturated color"
  ],
  "color_palette": "Black, white, gray tones",
  "mood": "Dark, atmospheric"
}
```

## Confidence Scoring

All AI outputs must include confidence scores:

- **0.9-1.0**: High confidence, clear intent, strong consistency
- **0.7-0.9**: Good confidence, minor ambiguities
- **0.5-0.7**: Moderate confidence, some uncertainty
- **<0.5**: Low confidence, should be flagged for review

Confidence factors:
- Clarity of input description
- Style consistency match
- Character/environment continuity
- Shot type appropriateness

## Context Isolation

### Per-Scene Isolation
- Each scene's AI operations are isolated
- No cross-scene context unless explicitly requested
- Style consistency maintained within scene
- Character/environment references scoped to scene

### Version Control
- Each panel generation creates a new version
- Previous versions preserved
- Style references link to specific versions
- Regeneration does not delete history

## Error Handling

### Low Confidence Responses
When confidence < 0.7:
1. Flag output for user review
2. Provide alternative suggestions
3. Request clarification if needed
4. Never auto-apply low-confidence outputs

### Consistency Failures
When style/character consistency fails:
1. Log the failure
2. Offer regeneration with stronger constraints
3. Allow manual override
4. Update style references if needed

## Implementation Notes

- All prompts stored in version-controlled files
- Prompt versions tracked for reproducibility
- A/B testing framework for prompt improvements
- User feedback loop for prompt refinement
- Logging of all AI operations for audit
