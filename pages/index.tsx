import {t} from "../src/intl"
import {Button} from "../components/button";
import {useContext} from "react";
import {VideoContext} from "./_app";
import {fileOpen} from "browser-fs-access";

export default function Start() {
  const [video, setVideo] = useContext(VideoContext);

  const selectFile = async () => {
    const file = await fileOpen({
      description: t("upload.hint"),
      mimeTypes: ["video/*"],
      startIn: "videos",
    });

    setVideo({file, status: "new"});
  };

  if (video?.file) {
    return <>
      <div className="container mx-auto">
        <h1>{t('conversion.title', {name: video.file.name})}</h1>
        <label>

        </label>
      </div>
    </>;
  }

  return <>
    <Button className="block mx-auto max-w-xs" onClick={selectFile}>
      <h1 className="text-2xl text-center my-4">
        {t('upload.title')}
      </h1>
      <p className="text-center my-4">
        {t('upload.description')}
      </p>
    </Button>
  </>;
};
