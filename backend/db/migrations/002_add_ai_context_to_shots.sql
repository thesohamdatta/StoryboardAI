-- Add AI-specific context fields to shots table
ALTER TABLE shots 
ADD COLUMN IF NOT EXISTS director_notes TEXT,
ADD COLUMN IF NOT EXISTS visual_style VARCHAR(100),
ADD COLUMN IF NOT EXISTS mood VARCHAR(100),
ADD COLUMN IF NOT EXISTS aspect_ratio VARCHAR(50);

-- Add AI prompt field to shots if we want to store the *intended* prompt before generation, 
-- though ai_generations table stores the *used* prompt. 
-- The user requested: "Prompt Transparency... AI-generated prompt is visible in UI... User can inspect and edit it... Prompt updates are local to that shot only"
-- This suggests the prompt might need to be stored on the shot so it persists across sessions even if not generated yet.
ALTER TABLE shots
ADD COLUMN IF NOT EXISTS generated_prompt TEXT;
