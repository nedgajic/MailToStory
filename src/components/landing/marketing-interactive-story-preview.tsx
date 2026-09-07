"use client";

import { useState } from "react";
import DigestRenderer from "@/components/digest/DigestRenderer";
import { StoryPageToolbar } from "@/components/stories/story-page-toolbar";
import type { Digest } from "@/lib/digest-schema";
import { speakerPaletteCssProperties } from "@/lib/participantColors";
import {
  storyPageThemeClass,
  type StoryColorMode,
  type StoryDisplayTheme,
} from "@/lib/story-reading-theme";

export function MarketingInteractiveStoryPreview({ digest }: { digest: Digest }) {
  const [displayTheme, setDisplayTheme] = useState<StoryDisplayTheme>("dossier");
  const [colorMode, setColorMode] = useState<StoryColorMode>("dark");

  return (
    <div className="mkt-demo-story-preview">
      <div
        className={`mkt-demo-story-preview__page story-page${storyPageThemeClass(displayTheme, colorMode)}`}
        style={speakerPaletteCssProperties(displayTheme, colorMode)}
      >
        <StoryPageToolbar
          digest={digest}
          storyId="marketing-demo"
          conversationId="marketing-demo"
          storyLength="normal"
          versions={[]}
          activeVersionId={null}
          canUseElaborate={false}
          creditsRemainingLabel={null}
          displayTheme={displayTheme}
          colorMode={colorMode}
          onDisplayThemeChange={setDisplayTheme}
          onColorModeChange={setColorMode}
          onRegenerated={() => {}}
          onVersionActivated={() => {}}
          onDelete={() => {}}
          hideRegenerate
          disableBack
          disableExport
          disableDelete
        />
        <div className="story-page__content mkt-demo-story-preview__content">
          <DigestRenderer
            hideAppTopBar
            digest={digest}
            threadId="marketing-demo"
            displayTheme={displayTheme}
            colorMode={colorMode}
          />
        </div>
      </div>
    </div>
  );
}
