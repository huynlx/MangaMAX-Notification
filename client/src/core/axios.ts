import axios from 'axios';

// constants
import { PUBLIC_SERVER_URL } from '~/constants';

const buildInstance = () => {
  return axios.create({
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    responseType: 'json',
    baseURL: PUBLIC_SERVER_URL
  });
};

export const http = buildInstance()


