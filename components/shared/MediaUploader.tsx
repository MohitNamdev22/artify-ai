"use client"

import { useToast } from "@/hooks/use-toast"
import { CldUploadWidget } from "next-cloudinary"
import React from "react";
import Image from "next/image";
import { dataUrl, getImageSize } from "@/lib/utils";
import { PlaceholderValue } from "next/dist/shared/lib/get-img-props";
import { CldImage } from "next-cloudinary";

type MediaUploaderProps = {
    onValueChange: (valule: string) => void;
    setImage: React.Dispatch<any>;
    publicId: string;
    image: any;
    type: string;
}

const MediaUploader = ({
    onValueChange,
    setImage,
    image,
    publicId,
    type
} : MediaUploaderProps) => {
    const {toast} = useToast()
    const onUploadSuccessHandler = (result: any) =>{
        setImage((prevState: any) => ({
            ...prevState,
            publicId: result?.info?.public_id,
            height: result?.info?.height,
            width: result?.info?.width,
            secureURL: result?.info?.secure_url,
        }))

        onValueChange(result?.info?.public_id)

        toast({
            title: 'Image uploaded successfully',
            description: '1 credit was deducted from account',
            duration: 5000,
            className: 'success-toast'
        })
    }

    

    const onUploadErrorHandler = () => {
        toast({
            title: 'Something went wrong while uploading',
            description: 'Please try again',
            duration: 5000,
            className: 'error-toast'
        })
    }
  return (
    <div>
      <CldUploadWidget
      uploadPreset="artify_ai"
      options={{
        multiple:false,
        resourceType: "image",
      }}
      onSuccess={onUploadSuccessHandler}
      onError = {onUploadErrorHandler}
      >
        {({open}) => (
            <div className="flex flex-col gap-4">
                <h3 className="h3-bold text-dark-600">

                    Original

                </h3>
                {publicId ? (
                    <>
                      <div className="cursor-pointer overflow-hidden rounded-[10px]">
                        <CldImage
                        width={getImageSize(type, image, "width")}
                        height={getImageSize(type, image, "height")}
                        src={publicId}
                        alt="image"
                        sizes={"(max-width: 767px) 100vw, 50vw"}
                        placeholder={dataUrl as PlaceholderValue}
                        className="media-uploader_cldImage"
                        />


                      </div>
                    </>
                ) : (
                    <div className="media-uploader_cta" onClick={()=> open()}>
                        <div className="media-uploader_cta-image">
                            <Image
                            src="/assets/icons/add.svg"
                            alt="Add Image"
                            width={24}
                            height={24}
                            />
                        </div>
                            <p className="p-14-medium">Click here to upload image</p>
                        HERE IS NO IMAGE
                        </div>
                )
            }

            </div>
        )}

      </CldUploadWidget>
    </div>
  )
}

export default MediaUploader
