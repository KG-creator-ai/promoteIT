import { AVCut, VideoPrompt, Campaign } from '../db/db';
import type { ChatCompletionMessageParam } from '@mlc-ai/web-llm';

export interface GenerationOptions {
  modelType: 'veo3' | 'runway_gen3' | 'sora2' | 'pika2';
  briefText: string;
  brandName: string;
}

export function buildAVGeneratorPrompt(options: GenerationOptions): ChatCompletionMessageParam[] {
  const { briefText, brandName, modelType } = options;

  let modelInstructions = '';
  switch (modelType) {
    case 'veo3':
      modelInstructions = 'For Veo 3: Provide 5-layer prompt structure (Subject/Action, Camera Mechanics, Environment/Lighting, Style/Mood, Audio/Soundscape).';
      break;
    case 'runway_gen3':
      modelInstructions = 'For Runway Gen-3: Provide visual prompt text + JSON camera motion parameters (horizontal, vertical, proximity, ambient values [-10.0 to 10.0], speed [0.1 to 10.0]).';
      break;
    case 'sora2':
      modelInstructions = 'For OpenAI Sora 2: Use ordered structure (Subject, Action, Camera, Environment, Lighting, Mood, Style).';
      break;
    case 'pika2':
      modelInstructions = 'For Pika 2.2: Provide motion-centric dynamic prompt card formats.';
      break;
  }

  return [
    {
      role: 'system',
      content: `You are the Master AV Script & Prompt Generator Engine for ${brandName}.
You must transform user briefs into a structured 6-Act promotional video arc:
Act 1: Regional Honor & Cultural/Industry Respect
Act 2: Brand Introduction & Local Relevance
Act 3: Core Legacy, Identity & Human Values
Act 4: Institutional Power, Trust & Stability
Act 5: Growth Vision & Strategic Milestones
Act 6: Call to Action & Event Invite

OUTPUT FORMAT:
Respond exclusively with a valid JSON string (no markdown formatting blocks, just the raw JSON object). 
Schema:
{
  "avScript": [
    {
      "act": number, // 1 to 6
      "timestampStart": string, // e.g. "00:00"
      "timestampEnd": string, // e.g. "00:10"
      "visualDescription": string,
      "cameraMovement": string,
      "audioVoiceover": string, // include phonetic guides for regional words
      "bgmCue": string
    }
  ],
  "videoPrompts": [
    {
      "actIndex": number,
      "targetModel": string, // must match requested model type
      "promptText": string,
      "jsonParameters": string // optional stringified JSON for things like runway gen-3
    }
  ],
  "timelineAssemblyGuide": string // Direct editor cut-list instructions
}

${modelInstructions}`
    },
    {
      role: 'user',
      content: `Generate the 6-Act campaign based on this brief: "${briefText}"`
    }
  ];
}

export function parseAVGeneratorResponse(responseText: string): Partial<Campaign> & { timelineAssemblyGuide?: string } {
  try {
    // Strip markdown code blocks if the LLM accidentally included them
    const cleanText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanText);
    
    return {
      avScript: data.avScript || [],
      videoPrompts: data.videoPrompts || [],
      timelineAssemblyGuide: data.timelineAssemblyGuide || ''
    };
  } catch (err) {
    console.error('Failed to parse AV Generator LLM response:', err);
    throw new Error('Invalid generation output format. Expected valid JSON.');
  }
}
