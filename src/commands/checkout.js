import R from 'ramda';
import path from 'path';
import { core } from './lfsCommands';
import {
  regex,
  BAD_CORE_RESPONSE,
  BAD_REGEX_PARSE_RESULT,
} from '../constants';

import generateResponse from '../utils/generateResponse';
// FIXME: refactor this to util
import { regexResult } from './push';

const isValidLine = str => str !== '';

const generateCheckoutStats = (raw) => {
  if (raw && typeof raw === 'string') {
    //eslint-disable-next-line
    let stats = {};

    const outputLines = raw.split('Git LFS:');
    const filteredLines = R.filter(isValidLine, outputLines);
    const statLine = filteredLines.pop();

    const byteResults = regexResult(statLine, regex.TOTAL_BYTES);

    stats.total_bytes_checked_out =
      byteResults !== null ?
        byteResults[0].trim() : BAD_REGEX_PARSE_RESULT;

    stats.total_bytes =
      byteResults !== null ?
        byteResults[1].trim() : BAD_REGEX_PARSE_RESULT;

    const fileResults = regexResult(statLine, regex.TOTAL_FILES);

    stats.total_files_checked_out =
      fileResults !== null ?
        fileResults[0].trim() : BAD_REGEX_PARSE_RESULT;

    const skippedByteResults = regexResult(statLine, regex.SKIPPED_BYTES);

    stats.total_bytes_skipped =
      skippedByteResults !== null ?
        skippedByteResults[0].trim() : BAD_REGEX_PARSE_RESULT;

    const skippedFileResults = regexResult(statLine, regex.SKIPPED_FILES);

    stats.total_files_skipped =
      skippedFileResults !== null ?
        skippedFileResults[0].trim() : BAD_REGEX_PARSE_RESULT;

    if (statLine.includes('error:')) {
      stats.checkout_error = statLine.split('error:')[1].trim();
    }

    return stats;
  }
  return {};
};

function checkout(repo, remoteArg, branchArg) {
  //eslint-disable-next-line
  let response = generateResponse();
  // repo.path() leads into workdir/.git
  const repoPath = path.join(repo.path(), '..');

  if (repo && branchArg && remoteArg) {
    return core.checkout(`${remoteArg} ${branchArg}`, { cwd: repoPath }).then(({ stdout, stderr }) => {
      response.raw = stdout;
      response.stderr = stderr;
      response.checkout = generateCheckoutStats(stdout);
      return response;
    }).catch((error) => {
      response.success = false;
      response.error = error.errno || BAD_CORE_RESPONSE;
      response.raw = error;
      return response;
    });
  }

  let remoteRef;
  //eslint-disable-next-line
  let branch;
  let remoteName;

  return repo.getCurrentBranch()
    .then((Reference) => {
      //eslint-disable-next-line
      let promises = [];
      promises.push(this.NodeGit.Branch.upstream(Reference));
      promises.push(this.NodeGit.Branch.name(Reference));
      return Promise.all(promises);
    })
    .then((results) => {
      remoteRef = results[0];
      branch = branchArg || results[1];
      //eslint-disable-next-line
      return this.NodeGit.Branch.remoteName(repo, remoteRef.name());
    })
    .then((name) => {
      remoteName = remoteArg || name;
      return core.checkout(`${remoteName} ${branch}`, { cwd: repo.path() });
    })
    .then(({ stdout, stderr }) => {
      response.raw = stdout;
      response.stderr = stderr;
      response.checkout = generateCheckoutStats(stdout);
      return response;
    })
    .catch((error) => {
      response.success = false;
      response.error = error.errno || BAD_CORE_RESPONSE;
      response.raw = error;
      return response;
    });
}

export default checkout;
