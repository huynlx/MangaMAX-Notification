import { FC, useEffect, useState } from 'react';

// core
import { http } from '~/core/axios';

// components
import Header from '~/components/Header';

// constants
import { PUSH_MANAGER, SERVICE_WORKER } from '~/constants';

// utils
import { handleRegistration } from '~/utils/register';

// types
import { InfoType, Subscription } from '~/shared/types';

// styles
import '~/styles/App.css';

const App: FC = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [info, setInfo] = useState<InfoType>([]);
  const [isNotSupported, setIsNotSupported] = useState(false);

  useEffect(() => {
    if (!(SERVICE_WORKER in navigator)) {
      console.log('No Service Worker support');
      setIsNotSupported(true);
    }

    if (!(PUSH_MANAGER in window)) {
      console.log('No Push API support');
      setIsNotSupported(true);
    }

    handleRegistration().then(subscription => {
      setSubscription(subscription);
    });
  }, []);

  const updateInfo = (subscription: Subscription | null) => {
    if (subscription !== null) {
      http
        .post("info", { ...subscription })
        .then(res => setInfo(res.data))
        .catch(err => console.log(err.response.data));
    }
  };

  useEffect(() => {
    updateInfo(subscription);
  }, [subscription]);

  if (isNotSupported || typeof Notification === 'undefined') {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex justify-center mx-3">
          <div className="bg-[#F9D7DA] text-[#842029] px-4 py-3 rounded-lg text-center">
            {/^((?!chrome|android).)*safari/i.test(navigator.userAgent)
              ? "Thiết bị với trình duyệt safari không hỗ trợ gửi thông báo"
              : "Thiết bị của bạn không hỗ trợ gửi thông báo"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        <Header />
      </div>
    </>
  );
};

export default App;
