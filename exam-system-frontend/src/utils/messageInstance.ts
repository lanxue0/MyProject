import { MessageInstance } from "antd/es/message/interface";

let messageApi: MessageInstance | null;

export const setMessageApi = (api: MessageInstance) => {
  messageApi = api;
};

export const getMessageApi = () => messageApi;
