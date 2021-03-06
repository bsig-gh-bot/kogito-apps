/*
 * Copyright 2020 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import _ from 'lodash';
import axios from 'axios';

import ApplyForVisaForm from '../../../tests/mocks/ApplyForVisa';
import { UserTaskInstance } from '../../../../graphql/types';
import { TaskInfoImpl } from '../../../../model/TaskInfo';
import { TaskFormSubmitHandler } from '../TaskFormSubmitHandler';

const userTaskInstance: UserTaskInstance = {
  id: '45a73767-5da3-49bf-9c40-d533c3e77ef3',
  description: null,
  name: 'Apply for visa',
  priority: '1',
  processInstanceId: '9ae7ce3b-d49c-4f35-b843-8ac3d22fa427',
  processId: 'travels',
  rootProcessInstanceId: null,
  rootProcessId: null,
  state: 'Ready',
  actualOwner: null,
  adminGroups: [],
  adminUsers: [],
  completed: null,
  started: '2020-02-19T11:11:56.282Z',
  excludedUsers: [],
  potentialGroups: [],
  potentialUsers: [],
  inputs:
    '{"Skippable":"true","trip":{"city":"Boston","country":"US","visaRequired":true},"TaskName":"VisaApplication","NodeName":"Apply for visa","traveller":{"firstName":"Rachel","lastName":"White","email":"rwhite@gorle.com","nationality":"Polish","address":{"street":"Cabalone","city":"Zerf","zipCode":"765756","country":"Poland"}},"Priority":"1"}',
  outputs: '{}',
  referenceName: 'VisaApplication',
  lastUpdate: '2020-02-19T11:11:56.282Z'
};

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const taskInfo = new TaskInfoImpl(
  userTaskInstance,
  'http://localhost:8080/travels'
);

let formData;
let handler;
let formSchema;
let successCallback;
let errorCallback;

const testSuccessfulRequest = async (phase: string, expectedPayload) => {
  const response = {
    status: 200
  };
  mockedAxios.post.mockResolvedValue(response);

  handler.getActions()[1].execute();
  await handler.doSubmit(formData);

  const calls = mockedAxios.post.mock.calls;

  const postParams = calls[calls.length - 1];

  expect(postParams).toHaveLength(3);

  const expectedEndpoint =
    taskInfo.getTaskEndPoint() + (phase ? '?phase=' + phase : '');

  expect(postParams[0]).toBe(expectedEndpoint);
  expect(postParams[1]).toMatchObject(expectedPayload);

  expect(successCallback).toBeCalledWith(phase);
  expect(errorCallback).not.toBeCalled();
};

const testUnSuccessfulRequest = async (
  response,
  phase,
  expecteErrorMessage
) => {
  mockedAxios.post.mockResolvedValue(response);

  handler.getActions()[1].execute();
  await handler.doSubmit(formData);

  expect(errorCallback).toBeCalledWith(phase, expecteErrorMessage);
  expect(successCallback).not.toBeCalled();
};

const testUnexpectedRequestError = async (
  error,
  phase,
  expecteErrorMessage
) => {
  mockedAxios.post.mockRejectedValue(error);

  handler.getActions()[1].execute();
  await handler.doSubmit(formData);

  expect(mockedAxios.post).toBeCalled();

  expect(errorCallback).toBeCalledWith(phase, expecteErrorMessage);
  expect(successCallback).not.toBeCalled();
};

describe('TaskFormSubmitHandler tests', () => {
  beforeEach(() => {
    formData = JSON.parse(userTaskInstance.inputs);

    formSchema = _.cloneDeep(ApplyForVisaForm);
    successCallback = jest.fn();
    errorCallback = jest.fn();

    handler = new TaskFormSubmitHandler(
      taskInfo,
      formSchema,
      successCallback,
      errorCallback
    );
  });

  test('Submit without selected phase', () => {
    handler.doSubmit({});

    expect(successCallback).not.toBeCalled();
    expect(errorCallback).not.toBeCalled();
  });

  test('Submit without actions', () => {
    delete formSchema.phase;

    handler = new TaskFormSubmitHandler(
      taskInfo,
      formSchema,
      successCallback,
      errorCallback
    );
    handler.doSubmit({});

    expect(successCallback).not.toBeCalled();
    expect(errorCallback).not.toBeCalled();
  });

  test('Successful submit', async () => {
    await testSuccessfulRequest(formSchema.phases[1], {
      traveller: formData.traveller
    });
  });

  test('Unsuccessful submit', async () => {
    const response = {
      status: 500,
      data: 'Task cannot be completed'
    };

    await testUnSuccessfulRequest(
      response,
      formSchema.phases[1],
      response.data
    );
  });

  test('Unexpected error on submit with full response', async () => {
    const error = {
      response: {
        status: 500,
        data: 'Task cannot be completed'
      }
    };
    await testUnexpectedRequestError(
      error,
      formSchema.phases[1],
      error.response.data
    );
  });

  it('Unexpected error on submit with response no data', async () => {
    const error = {
      response: {
        status: 500
      }
    };
    await testUnexpectedRequestError(error, formSchema.phases[1], undefined);
  });

  it('Unexpected error on submit with JS error', async () => {
    const error = {
      message: 'something really ugly happened!'
    };
    await testUnexpectedRequestError(
      error,
      formSchema.phases[1],
      error.message
    );
  });
});
