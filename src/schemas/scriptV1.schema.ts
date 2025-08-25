import { z } from 'zod';

const positionSchema = z.object({
  x: z.string(),
  y: z.string(),
});

const animationSchema = z.object({
  enter: z.object({
    name: z.string(),
    durationInFrames: z.number(),
    delay: z.number().optional(),
    easing: z.string().optional(),
  }),
  exit: z.object({
    name: z.string(),
    durationInFrames: z.number(),
    delay: z.number().optional(),
    easing: z.string().optional(),
  }).optional(),
});

// Element Prop Schemas
const backgroundPropsSchema = z.object({
  src: z.string(),
  fit: z.enum(['cover', 'contain', 'fill', 'none', 'scale-down']).optional(),
  animation: animationSchema.optional(),
});

const labelPropsSchema = z.object({
  text: z.string(),
  style: z.record(z.string()).optional(), // Simple style object
  position: positionSchema.optional(),
  animation: animationSchema.optional(),
});

const imagePropsSchema = z.object({
  src: z.string(),
  style: z.record(z.string()).optional(),
  position: positionSchema.optional(),
  animation: animationSchema.optional(),
});

const characterPropsSchema = z.object({
  model: z.string(), // e.g., 'character.glb'
  animation: z.string().optional(),
  lipSyncFile: z.string().optional(),
  position: positionSchema.optional(),
});

// Discriminated Union for Elements
export const elementSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('background'), props: backgroundPropsSchema }),
  z.object({ type: z.literal('label'), props: labelPropsSchema }),
  z.object({ type: z.literal('image'), props: imagePropsSchema }),
  z.object({ type: z.literal('character'), props: characterPropsSchema }),
]);

export const sceneSchema = z.object({
  id: z.string(),
  durationInFrames: z.number(),
  transitionIn: z.object({
    name: z.string(),
    durationInFrames: z.number(),
  }).optional(),
  elements: z.array(elementSchema),
});

export const captionSchema = z.object({
  text: z.string(),
  start: z.number(),
  end: z.number(),
});

export type Caption = z.infer<typeof captionSchema>;

export const scriptV1Schema = z.object({
  schemaVersion: z.literal('1.0'),
  meta: z.object({
    title: z.string(),
    fps: z.number(),
    width: z.number(),
    height: z.number(),
    stylePreset: z.string().optional(),
  }),
  audio: z.object({
    voiceover: z.object({
      url: z.string(),
      lipSyncFile: z.string().optional(),
      captions: z.array(captionSchema),
    }).optional(),
    music: z.object({
      url: z.string(),
      gainDb: z.number().optional(),
      duckingOnVoiceover: z.boolean().optional(),
    }).optional(),
  }),
  scenes: z.array(sceneSchema),
});

export type ScriptV1 = z.infer<typeof scriptV1Schema>;
export type Scene = z.infer<typeof sceneSchema>;
export type VideoElement = z.infer<typeof elementSchema>;

