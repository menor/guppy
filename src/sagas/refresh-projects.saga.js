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

    const { parsedProjects, deletedProjects } = yield call(
      parseProjects,
      projectsFromDisk
    );

    yield put(refreshProjectsFinish(parsedProjects));
    if (deletedProjects.length > 0) {
      const response = yield call([dialog, dialog.showMessageBox], {
        type: 'warning',
        cancelId: 2,
        title: `Orphan Projects`,
        message: `Not found ${deletedProjects.join(', ')}`,
      });
    }
  } catch (err) {
    yield put(refreshProjectsError(err));
  }
}

export default function* rootSaga(): Saga<void> {
  yield takeEvery(REFRESH_PROJECTS_START, refreshProjects);
}
