import { ActionPanel, Detail, List, Action, Icon } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { exec } from "child_process";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Skill {
  id: string;
  skillId: string;
  name: string;
  installs: number;
  source: string;
}

interface SearchResponse {
  skills: Skill[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatInstalls(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1)}K`;
  }
  return String(n);
}

function getInstallCommand(skill: Skill): string {
  return `npx skills add ${skill.source} --skill ${skill.name}`;
}

function runInTerminal(command: string): void {
  const escaped = command.replace(/"/g, '\\"');
  exec(`osascript -e 'tell application "Terminal" to do script "${escaped}"'`);
}

// ---------------------------------------------------------------------------
// Shared ActionPanel
// ---------------------------------------------------------------------------

function SkillActions({ skill }: { skill: Skill }) {
  const installCommand = getInstallCommand(skill);

  return (
    <ActionPanel>
      <Action.Push
        title="View Details"
        icon={Icon.Eye}
        target={<SkillDetail skill={skill} />}
      />
      <Action.CopyToClipboard
        title="Copy Install Command"
        content={installCommand}
        shortcut={{ modifiers: ["cmd"], key: "k" }}
      />
      <Action
        title="Send to Terminal"
        icon={Icon.Terminal}
        shortcut={{ modifiers: ["cmd", "shift"], key: "enter" }}
        onAction={() => runInTerminal(installCommand)}
      />
      <Action.OpenInBrowser
        title="Open on skills.sh"
        url={`https://skills.sh/${skill.id}`}
        shortcut={{ modifiers: ["cmd"], key: "o" }}
      />
    </ActionPanel>
  );
}

// ---------------------------------------------------------------------------
// Detail View
// ---------------------------------------------------------------------------

function SkillDetail({ skill }: { skill: Skill }) {
  const installCommand = getInstallCommand(skill);

  const markdown = `# ${skill.name}

Install this skill by running:

\`\`\`bash
${installCommand}
\`\`\`

[View on skills.sh](https://skills.sh/${skill.id})
`;

  return (
    <Detail
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Installs" text={formatInstalls(skill.installs)} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Link
            title="Repository"
            text={skill.source}
            target={`https://github.com/${skill.source}`}
          />
          <Detail.Metadata.Link
            title="skills.sh"
            text={skill.name}
            target={`https://skills.sh/${skill.id}`}
          />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Install Command" text={installCommand} />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Install Command" content={installCommand} />
          <Action
            title="Send to Terminal"
            icon={Icon.Terminal}
            shortcut={{ modifiers: ["cmd", "shift"], key: "enter" }}
            onAction={() => runInTerminal(installCommand)}
          />
          <Action.OpenInBrowser
            title="Open on skills.sh"
            url={`https://skills.sh/${skill.id}`}
            shortcut={{ modifiers: ["cmd"], key: "o" }}
          />
        </ActionPanel>
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Main Command
// ---------------------------------------------------------------------------

export default function Command() {
  const [searchText, setSearchText] = useState("");

  const { data, isLoading } = useFetch<SearchResponse>(
    `https://skills.sh/api/search?q=${encodeURIComponent(searchText)}&limit=25`,
    {
      keepPreviousData: true,
      execute: searchText.length > 0,
    },
  );

  const skills = (data?.skills ?? []).sort((a, b) => b.installs - a.installs);

  return (
    <List
      isLoading={isLoading}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      filtering={false}
      throttle
      searchBarPlaceholder="Search agent skills…"
    >
      {skills.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="Search for agent skills"
          description="Type a query to search skills.sh"
        />
      ) : (
        skills.map((skill) => (
          <List.Item
            key={skill.id}
            icon={Icon.Book}
            title={skill.name}
            subtitle={skill.source}
            accessories={[{ text: formatInstalls(skill.installs) }]}
            actions={<SkillActions skill={skill} />}
          />
        ))
      )}
    </List>
  );
}
