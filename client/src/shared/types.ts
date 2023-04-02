export interface Subscription {
  endpoint: string;
  keys: {
    p256dh: string,
    auth: string;
  };
}

export interface Comic {
  _id: string;
  cover: string;
  createAt: string;
  latestChapter: string;
  title: string;
  updateAt: string;
}

export type InfoType = Comic[];
