// @flow
import { remote } from 'electron';
import { call, put, select, takeEvery } from 'redux-saga/effects';

import {
  refreshProjectsFinish,
  refreshProjectsError,
  REFRESH_PROJECTS_START,
} from '../actions';
import {
  loadGuppyProjects,
  parseProjects,
} from '../services/read-from-disk.service';
import { getPathsArray } from '../reducers/paths.reducer';
import type { Saga } from 'redux-saga';

const { dialog } = remote;
export function* refreshProjects(): Saga<void> {
  const pathsArray = yield select(getPathsArray);

  try {
    const projectsFromDisk = yield call(loadGuppyProjects, pathsArray);

    const { validProjects, deletedProjects } = yield call(
      parseProjects,
      projectsFromDisk
    );

    yield put(refreshProjectsFinish(validProjects));

    // We show an alert if we found deleted projects
    if (deletedProjects.length > 0) {
      yield call(
        [dialog, dialog.showMessageBox],
        getDeletedProjectsMessage(deletedProjects)
      );
    }
  } catch (err) {
    yield put(refreshProjectsError(err));
  }
}

// TODO: Improve the message interface, handle plurals
// See how we can make this more clear to the user
// Does this function belong in this file or should it be moved elsewhere?
const getDeletedProjectsMessage = deletedProjects => ({
  type: 'warning',
  title: `Orphan Projects`,
  message: `Guppy couln't find the project(s) on disk ${deletedProjects.join(
    ', '
  )}`,
});

export default function* rootSaga(): Saga<void> {
  yield takeEvery(REFRESH_PROJECTS_START, refreshProjects);
}
