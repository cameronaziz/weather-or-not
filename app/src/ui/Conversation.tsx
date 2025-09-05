import clsx from "clsx";
import { useContext, type FC } from "react";
import Convo from "../context/convo";

const Conversation: FC = () => {
  const { messages, isConvoMode } = useContext(Convo.Context)

  return (
    <div className={clsx(
      "flex flex-col items-center p-8 transition-all duration-300 ease-in-out",
      {
        "opacity-100 translate-y-0": isConvoMode,
        "opacity-0 -translate-y-4 pointer-events-none": !isConvoMode
      }
    )}>
      <style>{`
        .send:before {
          right: -8px;
          width: 20px;
          background-color: #e9d4ff;
          border-bottom-left-radius: 16px 14px;
          transition: all 0.3s ease-in-out;
        }
        .send:after {
          right: -26px;
          width: 26px;
          background-color: #ad46ff;
          border-bottom-left-radius: 10px;
          transition: all 0.3s ease-in-out;
        }
        .send:before, .send:after {
          content: "";
          position: absolute;
          bottom: -3px;
          height: 22px;
        }
      `}</style>
      <div className="flex flex-col w-full">
        {messages.map((message) => {
          const isSender = message.role === 'user';
          const bubbleClasses = clsx(
            'max-w-[80%] text-sm mb-3 relative rounded-[25px] p-[5px_10px] transition-all duration-300 ease-in-out',
            {
              'relative bg-purple-200 text-black-800 rounded-xl px-3 self-end send': isSender,
              'bg-green-800 text-gray-200 rounded-sm font-mono': !isSender,
            }
          );
          return (
            <div key={message.text} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
              <div className={bubbleClasses}>
                {message.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Conversation