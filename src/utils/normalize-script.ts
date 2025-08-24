import { scriptV1Schema, ScriptV1 } from '../schemas/scriptV1.schema';

// Phát hiện script đã theo chuẩn Remotion chưa
const isRemotionScriptV1 = (data: any): boolean => {
  return Boolean(data?.scenes?.[0]?.durationInFrames != null);
};

// Chuyển đổi MCP Script (phẳng) -> Remotion Script V1 (có props)
export const normalizeScript = (data: any): ScriptV1 => {
  if (isRemotionScriptV1(data)) {
    // Đã đúng schema Remotion
    return scriptV1Schema.parse(data);
  }

  const fps: number = Number(data?.meta?.fps) || 30;

  const mapAnimationEnter = (enter: any | undefined) => {
    if (!enter) return undefined;
    return {
      enter: {
        name: String(enter.name),
        durationInFrames: Number(enter.duration) || 0,
        delay: typeof enter.delay === 'number' ? enter.delay : undefined,
        easing: typeof enter.easing === 'string' ? enter.easing : undefined,
      },
    };
  };

  const scenes = (Array.isArray(data?.scenes) ? data.scenes : []).map((sc: any, idx: number) => {
    const elements = (Array.isArray(sc?.elements) ? sc.elements : [])
      .map((el: any) => {
        const type = el?.type;
        if (type === 'background') {
          return {
            type: 'background' as const,
            props: {
              src: String(el.src),
              fit: el.fit || 'cover',
              animation: mapAnimationEnter(el?.enter),
            },
          };
        }
        if (type === 'label') {
          const style: Record<string, string> = {};
          if (el?.size?.w) style.width = String(el.size.w);
          if (el?.size?.h) style.height = String(el.size.h);
          return {
            type: 'label' as const,
            props: {
              text: String(el.text ?? ''),
              style: Object.keys(style).length ? style : undefined,
              position: el?.pos ? { x: String(el.pos.x), y: String(el.pos.y) } : undefined,
              animation: mapAnimationEnter(el?.enter),
            },
          };
        }
        if (type === 'image') {
          const style: Record<string, string> = {};
          if (el?.size?.w) style.width = String(el.size.w);
          if (el?.size?.h) style.height = String(el.size.h);
          return {
            type: 'image' as const,
            props: {
              src: String(el.src),
              style: Object.keys(style).length ? style : undefined,
              position: el?.pos ? { x: String(el.pos.x), y: String(el.pos.y) } : undefined,
              animation: mapAnimationEnter(el?.enter),
            },
          };
        }
        if (type === 'character') {
          return {
            type: 'character' as const,
            props: {
              model: String(el.model),
              lipSyncFile: el?.lipSyncFile ? String(el.lipSyncFile) : undefined,
              position: el?.pos ? { x: String(el.pos.x), y: String(el.pos.y) } : undefined,
            },
          };
        }
        return null;
      })
      .filter(Boolean) as any[];

    return {
      id: String(sc?.id ?? `scene-${idx + 1}`),
      durationInFrames: Number(sc?.duration) || 0,
      transitionIn: sc?.transitionIn
        ? {
            name: String(sc.transitionIn.name),
            durationInFrames: Number(sc.transitionIn.duration) || 0,
          }
        : undefined,
      elements,
    };
  });

  // Audio chuyển đổi captions: (t,d) là frame -> (start,end) là giây
  const voiceover = data?.audio?.voiceover;
  const captionsRaw = Array.isArray(voiceover?.captions) ? voiceover.captions : [];
  const captions = captionsRaw
    .map((c: any) => {
      if (c && typeof c.start === 'number' && typeof c.end === 'number') {
        return { text: String(c.text ?? ''), start: c.start, end: c.end };
      }
      if (c && typeof c.t === 'number' && typeof c.d === 'number') {
        return { text: String(c.text ?? ''), start: c.t / fps, end: (c.t + c.d) / fps };
      }
      return null;
    })
    .filter(Boolean) as { text: string; start: number; end: number }[];

  const normalized: ScriptV1 = scriptV1Schema.parse({
    schemaVersion: '1.0',
    meta: {
      title: String(data?.meta?.title ?? 'Untitled'),
      fps,
      width: Number(data?.meta?.width) || 1080,
      height: Number(data?.meta?.height) || 1920,
      stylePreset: data?.meta?.stylePreset ? String(data.meta.stylePreset) : undefined,
    },
    audio: {
      voiceover: voiceover?.url
        ? {
            url: String(voiceover.url),
            captions,
          }
        : undefined,
      music: data?.audio?.music?.url
        ? {
            url: String(data.audio.music.url),
            gainDb: typeof data.audio.music.gainDb === 'number' ? data.audio.music.gainDb : undefined,
            duckingOnVoiceover:
              typeof data.audio.music.duckingOnVoiceover === 'boolean'
                ? data.audio.music.duckingOnVoiceover
                : undefined,
          }
        : undefined,
    },
    scenes,
  });

  return normalized;
};
