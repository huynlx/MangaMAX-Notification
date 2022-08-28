import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import webPush from "web-push";
import mongoose from "mongoose";
import parse from "node-html-parser";
import path from "path";
import Subscriptions, { SubscriptionType } from "./models/Subscriptions";
import Mangas, { MangaType } from "./models/Mangas";
import { splitArray } from "./shared/utils";

const app = express();

app.use(express.static(path.join(__dirname, '../client')));
app.use(express.json());
app.use(cors());
app.enable("trust proxy");

dotenv.config();

const client = axios.create({
  baseURL: process.env.MANGA_URL,
});

const publicVapidKey = process.env.PUBLIC_VAPID_KEY as string;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY as string;

const headers = webPush.getVapidHeaders(
  "http://localhost:3000",
  "http://localhost:3000",
  publicVapidKey,
  privateVapidKey,
  "aesgcm"
);

webPush.setVapidDetails(
  "http://localhost:3000",
  publicVapidKey,
  privateVapidKey
);

mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('Successfully connected to mongodb database'))
  .catch((err) => console.log(err));

app.get('/', (req, res) => {
  res.send('MangaMax Notification Server');

  // After res.send() 
  console.log(res.headersSent);
});

app.post('/info', async (req, res) => {
  try {
    const { body } = req;

    if (
      !body?.endpoint ||
      !body?.keys?.p256dh ||
      !body?.keys?.auth
    ) {
      return res.status(400).send({
        message: "Yêu cầu đéo hợp lệ"
      });
    }

    const existingSubscriptions = await Subscriptions.find({
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth
    })
      .populate("mangaId")
      .sort({ createAt: -1 });

    res.send(existingSubscriptions.map(item => item.mangaId).filter(Boolean));
  } catch (error) {
    if (!res.headersSent) res.sendStatus(500);
  }
});


app.post('/subscribe', async (req, res) => {
  try {
    const { body } = req;

    let { mangaId } = body;

    let title: string | undefined = "";

    if (
      !body?.endpoint ||
      !body?.keys?.p256dh ||
      !body?.keys?.auth ||
      !mangaId
    ) {
      return res.status(400).send({
        message: 'Yêu cầu đéo hợp lệ'
      });
    }

    try {
      const source = (await client.get(`truyen-tranh/${mangaId}`)).data;
      const dom = parse(source);

      const url = dom.querySelector('meta[property=og:url')?.getAttribute('content');

      title = dom.querySelector("#item-detail .title-detail")?.innerText;

      const cover = dom.querySelector("#item-detail .detail-info img")?.getAttribute('src')?.replace("//", "https://");

      if (
        !url ||
        !url.includes("/truyen-tranh") ||
        !title ||
        !cover
      ) {
        throw new Error("");
      }

      const latestChapter = dom.querySelector(".list-chapter ul li a")?.innerText;

      if (!latestChapter) throw new Error("");

      mangaId = url.split("/").slice(-1)[0];

      const existingManga = await Mangas.findOne({
        _id: mangaId
      });

      if (!existingManga) {
        await Mangas.create({
          _id: mangaId,
          latestChapter,
          title,
          cover
        });
      }
    } catch (error) {
      return res.status(400).send({
        message: "Đéo tìm thấy truyện được yêu cầu"
      });
    }

    const existingSubscription = await Subscriptions.findOne({
      mangaId,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth
    });

    if (!existingSubscription) {
      await Subscriptions.create({
        mangaId,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth
      });
    }

    res.send({
      message: "Theo dõi truyện thành công"
    });

    await webPush.sendNotification(
      {
        endpoint: body.endpoint,
        keys: {
          auth: body.keys.auth,
          p256dh: body.keys.p256dh
        }
      },
      JSON.stringify({
        title: "Đã bật thông báo",
        body: title,
        badge: "https://mangamax-huynh.cf/_next/image?url=/favicon.ico&w=300&q=100",
        icon: "https://mangamax-huynh.cf/_next/image?url=/favicon.ico&w=300&q=100",
        data: {
          url: `${process.env.MANGA_URL}truyen-tranh/${mangaId}`
        }
      }),
      {
        headers
      }
    );
  } catch (error) {
    console.log(error);
    if (!res.headersSent)
      res.status(500).send({
        message: 'Có lỗi xảy ra ở Server'
      });
  }
});

app.post('/unsubscribe', async (req, res) => {
  try {
    const { body } = req;

    if (
      !body?.endpoint ||
      !body?.keys?.p256dh ||
      !body?.keys?.auth ||
      !body?.mangaId
    ) {
      return res.status(400).send({
        message: "Yêu cầu đéo hợp lệ"
      });
    }

    await Subscriptions.findOneAndDelete({
      endpoint: body.endpoint,
      p256dh: body.p256dh,
      auth: body.keys.auth,
      mangaId: body.mangaId
    });

    res.sendStatus(200);
  } catch (error) {
    if (!res.headersSent) res.sendStatus(500);
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running → PORT ${port}`);
});

setInterval(async () => {
  const startTime = new Date().toLocaleString();
  const message = `Operation at ${startTime} took: `;

  console.time('message');

  const existingSubscriptions = (await Subscriptions.find()) as SubscriptionType[];

  const grouped = existingSubscriptions.reduce(
    (acc, current) => {
      if (!acc.find((item) => item.mangaId === current.mangaId))
        acc.push({ mangaId: current.mangaId, subscriptions: [] });

      acc?.find((item) => item.mangaId === current.mangaId)?.subscriptions.push(current);

      return acc;
    },
    [] as {
      mangaId: string;
      subscriptions: SubscriptionType[];
    }[]
  );

  const splitted = splitArray(grouped, 10);

  for (const group of splitted) {
    await Promise.allSettled(
      group.map(async (item) => {
        try {
          const existingManga = (await Mangas.findOne({
            _id: item.mangaId
          })) as MangaType;

          if (!existingManga) throw new Error("");

          const source = (await client.get(`truyen-tranh/${item.mangaId}`)).data;

          const dom = parse(source);

          const url = dom.querySelector("meta[property=og:url]")?.getAttribute('content');

          if (!url || !url.includes("/truyen-tranh/")) throw new Error("");

          const lastestChapter = dom.querySelector(".list-chapter ul li a")?.innerText;

          if (lastestChapter !== existingManga.latestChapter) {
            await Mangas.findOneAndUpdate(
              {
                _id: existingManga._id,
              },
              {
                lastestChapter
              }
            );

            const splittedSubscriptions = splitArray(item.subscriptions, 10);

            for (const subscriptionGroup of splittedSubscriptions) {
              await Promise.allSettled(
                subscriptionGroup.map(async (subscription) => {
                  try {
                    await webPush.sendNotification(
                      {
                        endpoint: subscription.endpoint,
                        keys: {
                          auth: subscription.auth,
                          p256dh: subscription.p256dh
                        }
                      },
                      JSON.stringify({
                        title: `${existingManga.title} đã có chap mới`,
                        body: lastestChapter,
                        badge: "https://mangamax-huynh.cf/_next/image?url=/favicon.ico&w=300&q=100",
                        icon: "https://mangamax-huynh.cf/_next/image?url=/favicon.ico&w=300&q=100",
                        image: existingManga.cover,
                        data: {
                          url: `${client.defaults.baseURL}/truyen-tranh/${existingManga._id}`
                        }
                      }),
                      {
                        headers
                      }
                    );
                  } catch (error: any) {
                    if (
                      error?.body?.includes("expire") ||
                      error?.body?.includes("unsubscribe")
                    ) {
                      await Subscriptions.deleteOne(subscription);
                    }
                  }
                })
              );
            }
          }
        } catch (error) {
          await Subscriptions.deleteMany({ mangaId: item.mangaId });
        }
      })
    );
  }

  console.timeEnd(message);

}, 1000 * 60 * 5);