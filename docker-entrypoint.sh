#!/usr/bin/env bash

isCommand() {
  for cmd in \
    "access" \
    "adduser" \
    "audit" \
    "bin" \
    "bugs" \
    "build" \
    "bundle" \
    "cache" \
    "ci" \
    "completion" \
    "config" \
    "dedupe" \
    "deprecate" \
    "dist-tag" \
    "docs" \
    "doctor" \
    "edit" \
    "explore" \
    "help-search" \
    "help" \
    "hook" \
    "init" \
    "install-ci-test" \
    "install-test" \
    "install" \
    "link" \
    "logout" \
    "ls" \
    "npm" \
    "org" \
    "outdated" \
    "owner" \
    "pack" \
    "ping" \
    "prefix" \
    "profile" \
    "prune" \
    "publish" \
    "rebuild" \
    "repo" \
    "restart" \
    "root" \
    "run-script" \
    "search" \
    "shrinkwrap" \
    "star" \
    "stars" \
    "start" \
    "stop" \
    "team" \
    "test" \
    "token" \
    "uninstall" \
    "unpublish" \
    "update" \
    "version" \
    "view" \
    "whoami"
  do
    if [ -z "${cmd#"$1"}" ]; then
      return 0
    fi
  done

  return 1
}

# check if the first argument passed in looks like a flag
if [ "$(printf %c "$1")" = '-' ]; then
  set -- /sbin/tini -- npm "$@"
# check if the first argument passed in is composer
elif [ "$1" = 'npm' ]; then
  set -- /sbin/tini -- "$@"
# check if the first argument passed in matches a known command
elif isCommand "$1"; then
  set -- /sbin/tini -- npm "$@"
fi

exec "$@"
