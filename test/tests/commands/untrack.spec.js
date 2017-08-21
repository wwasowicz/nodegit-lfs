import path from 'path';
import { todo } from '../../utils';
import track from '../../../build/src/commands/track';
import untrack from '../../../build/src/commands/untrack';

describe('Untrack', () => {
  it('does generate untrack response', function () {
    const {
      NodeGitLFS
    } = this;

    const lfsTestRepoPath = path.resolve(__dirname, '..', '..', 'repos', 'lfs-test-repository');

    let repository;

    return NodeGitLFS.Repository.open(lfsTestRepoPath)
      .then((repo) => {
        repository = repo;
        return track(repo, ['*.png', '*.dmg', '*.txt', '*.a']);
      })
      .then(() => untrack(repository, ['*.dmg', '*.a']))
      .then(() => todo());
  });
});
