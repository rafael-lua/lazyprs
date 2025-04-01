#!/usr/bin/env node
import { defineCommand, runMain } from 'citty';
import { consola } from 'consola';
import { execa, execaSync } from 'execa';
import { nanoid } from 'nanoid';

const cli = defineCommand({
  meta: {
    name: "lazyprs",
    version: "1.0.0",
    description: "Make quick PRs from a range of commits"
  },
  args: {
    base: {
      type: "positional",
      description: "Branch to open pr against",
      required: true
    },
    branch: {
      type: "string",
      description: "Created branch name"
    },
    // TODO: use prompt for title
    title: {
      type: "string",
      description: "Title to use for pr"
    },
    from: {
      type: "string",
      description: "Branch or sha to use in merge-base for commit range. Default is {base}"
    },
    draft: {
      type: "boolean",
      description: "Open as draft"
    },
    keep: {
      type: "boolean",
      description: "Keep local branch after pr is created"
    },
    ["ignore-templates"]: {
      type: "boolean",
      description: "Keep local branch after pr is created"
    },
    // TODO: use prompt for body
    body: {
      type: "string",
      description: "Body to use for pr"
    }
  },
  async run({ args }) {
    consola.box("Lazy PRs");
    const base = args.base;
    const draft = args.draft;
    const keep = args.keep;
    const ignoreTemplate = args["ignore-templates"];
    const from = args.from || base;
    const branchName = args.branch || `lazy-prs-${nanoid()}`;
    const title = args.title || `Lazy PR | ${branchName}`;
    const body = args.body || "Automatically created with lazy prs.";
    const { stdout: mergeBase } = await execa("git", [
      "merge-base",
      "HEAD",
      from
    ]);
    const { stdout: logs } = await execa("git", [
      "log",
      '--pretty=format:"%h	%s"',
      `${mergeBase}..HEAD`
    ]);
    const logsOptions = logs.split("\n");
    const res = await consola.prompt(
      "Select the commits to include in the PR",
      {
        type: "multiselect",
        options: logsOptions.map((it) => it.replaceAll('"', ""))
      }
    );
    const logsSplitOptions = res.map((it) => it.split("	"));
    consola.info(`Creating branch ${branchName} from ${from}`);
    await execa("git", ["checkout", "-b", branchName, from]);
    consola.info(`Cherry picking commits`);
    logsSplitOptions.forEach((it) => {
      const [sha, message] = it;
      consola.log(` - commiting ${sha} - ${message}`);
      if (sha)
        execaSync("git", [
          "cherry-pick",
          sha,
          "--allow-empty",
          "--keep-redundant-commits"
        ]);
    });
    consola.info(`Pushing to remote`);
    await execa("git", ["push", "-u", "origin", "HEAD"]);
    consola.info(`Creating PR for ${branchName} against ${base}`);
    await execa("gh", [
      "pr",
      "create",
      "--base",
      base,
      "--title",
      title,
      ...ignoreTemplate ? ["--body", body] : ["--fill", "--body-file", ".github/PULL_REQUEST_TEMPLATE.md"],
      ...draft ? ["--draft"] : []
    ]);
    await execa("git", ["checkout", "-"]);
    if (!keep) await execa("git", ["branch", "-D", branchName]);
    consola.info("Done!");
  }
});
runMain(cli);
