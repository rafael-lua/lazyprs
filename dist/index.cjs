#!/usr/bin/env node
'use strict';

const citty = require('citty');
const consola = require('consola');
const execa = require('execa');
const nanoid = require('nanoid');

const cli = citty.defineCommand({
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
    consola.consola.box("Lazy PRs");
    const base = args.base;
    const draft = args.draft;
    const keep = args.keep;
    const ignoreTemplate = args["ignore-templates"];
    const from = args.from || base;
    const branchName = args.branch || `lazy-prs-${nanoid.nanoid()}`;
    const title = args.title || `Lazy PR | ${branchName}`;
    const body = args.body || "Automatically created with lazy prs.";
    const { stdout: mergeBase } = await execa.execa("git", [
      "merge-base",
      "HEAD",
      from
    ]);
    const { stdout: logs } = await execa.execa("git", [
      "log",
      '--pretty=format:"%h	%s"',
      `${mergeBase}..HEAD`
    ]);
    const logsOptions = logs.split("\n");
    const res = await consola.consola.prompt(
      "Select the commits to include in the PR",
      {
        type: "multiselect",
        options: logsOptions.map((it) => it.replaceAll('"', ""))
      }
    );
    const logsSplitOptions = res.map((it) => it.split("	"));
    consola.consola.info(`Creating branch ${branchName} from ${from}`);
    await execa.execa("git", ["checkout", "-b", branchName, from]);
    consola.consola.info(`Cherry picking commits`);
    logsSplitOptions.forEach((it) => {
      const [sha, message] = it;
      consola.consola.log(` - commiting ${sha} - ${message}`);
      if (sha)
        execa.execaSync("git", [
          "cherry-pick",
          sha,
          "--allow-empty",
          "--keep-redundant-commits"
        ]);
    });
    consola.consola.info(`Pushing to remote`);
    await execa.execa("git", ["push", "-u", "origin", "HEAD"]);
    consola.consola.info(`Creating PR for ${branchName} against ${base}`);
    await execa.execa("gh", [
      "pr",
      "create",
      "--base",
      base,
      "--title",
      title,
      ...ignoreTemplate ? ["--body", body] : ["--fill", "--body-file", ".github/PULL_REQUEST_TEMPLATE.md"],
      ...draft ? ["--draft"] : []
    ]);
    await execa.execa("git", ["checkout", "-"]);
    if (!keep) await execa.execa("git", ["branch", "-D", branchName]);
    consola.consola.info("Done!");
  }
});
citty.runMain(cli);
