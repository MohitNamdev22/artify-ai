"use client"

import { aspectRatioOptions, creditFee, defaultValues } from "@/constants"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { transformationTypes } from '@/constants'
import { debounce } from "@/lib/utils" 
import { deepMergeObjects } from "@/lib/utils"
import { useEffect } from "react"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import {
    Form,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { CustomField } from "./CustomField"
import { useState, useTransition } from "react"
import { AspectRatioKey } from "@/lib/utils"
import { Button } from "../ui/button"
import { updateCredits } from "@/lib/actions/user.actions"
import MediaUploader from "./MediaUploader"
import TransformedImage from "./TransformedImage"
import { getCldImageUrl } from "next-cloudinary"
import { addImage, updateImage } from "@/lib/actions/image.action"
import { useRouter } from "next/navigation"
import { InsufficientCreditsModal } from "./InsufficientCreditsModal"

export const formSchema = z.object({
    title: z.string(),
    aspectRatio: z.string().optional(),
    color: z.string().optional(),
    prompt: z.string().optional(),
    publicId: z.string(),
})

// Define interfaces for improved type safety
interface ImageState {
    publicId?: string;
    width?: number;
    height?: number;
    secureURL?: string;
    aspectRatio?: string;
}

interface TransformationConfig {
    [key: string]: {
        [subKey: string]: string | number;
    };
}

const TransformationForm = ({ action, data = null, userId, type, creditBalance, config = null }: TransformationFormProps) => {
    const transformationType = transformationTypes[type];
    const [image, setImage] = useState<ImageState | null>(data);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTransforming, setIsTransforming] = useState(false);
    const [transformationConfig, setTransformationConfig] = useState<TransformationConfig | null>(config);
    const [newTransformation, setNewTransformation] = useState<TransformationConfig | null>(null);
    const [isPending, startTransition] = useTransition()
    const initialValues = data && action === 'Update' ? {
        title: data?.title,
        aspectRatio: data?.aspectRatio,
        color: data?.color,
        prompt: data?.prompt,
        publicId: data?.publicId,
    } : defaultValues

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialValues,
    })

    console.log(isPending);

    const router = useRouter();

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        
        if(data || image){
            const transformationUrl = getCldImageUrl({
                width: image?.width,
                height: image?.height,
                src: image?.publicId,
                ...transformationConfig
            })

            const imageData = {
                title: values.title,
                publicId: image?.publicId,
                transformationType: type,
                width: image?.width,
                height: image?.height,
                config: transformationConfig,
                secureURL: image?.secureURL,
                transformationURL: transformationUrl,
                aspectRatio: values.aspectRatio,
                prompt: values.prompt,
                color: values.color,
            }

            if(action === 'Add'){
                try{
                    const newImage = await addImage({
                        image: imageData,
                        userId,
                        path:'/'
                    })

                    if(newImage){
                        form.reset()
                        setImage(data)
                        router.push(`/transformations/${newImage._id}`)
                    }
                } catch (error){
                    console.log(error);
                }
            }

            if(action === 'Update'){
                try{
                    const updatedImage = await updateImage({
                        image: {
                            ...imageData,
                            _id: data._id
                        },
                        userId,
                        path:`/transformations/${data._id}`
                    })

                    if(updatedImage){
                        router.push(`/transformations/${updatedImage._id}`)
                    }
                } catch (error){
                    console.log(error);
                }
            }
        }
        setIsSubmitting(false)
        console.log(values)
    }

    const onSelectFieldHandler = (value: string, onChangeField: (value: string) => void) => {
        const imageSize = aspectRatioOptions[value as AspectRatioKey]

        setImage((prevState: ImageState | null) => prevState ? ({
            ...prevState,
            aspectRatio: imageSize.aspectRatio,
            width: imageSize.width,
            height: imageSize.height,
        }) : null)

        setNewTransformation(transformationType.config);
        return onChangeField(value);
    }

    const onInputChangeHandler = (
        fieldName: string, 
        value: string, 
        transformType: string, 
        onChangeField: (value: string) => void
    ) => {
        debounce(() => {
            setNewTransformation((prevState) => ({
                ...prevState,
                [transformType]: {
                    ...prevState?.[transformType],
                    [fieldName === 'prompt' ? 'prompt' : 'to']: value
                }
            }))
        }, 1000)();
        return onChangeField(value);
    }

    const onTransformHandler = async () => {
        setIsTransforming(true)

        setTransformationConfig(
            deepMergeObjects(newTransformation, transformationConfig)
        )

        setNewTransformation(null)

        startTransition(async () => {
            await updateCredits(userId, creditFee)
        })
    }

    useEffect(() => {
        if(image && (type === 'restore' || type === 'removeBackground')) {
            setNewTransformation(transformationType.config)
        }
    }, [image, transformationType.config, type])


    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {creditBalance < Math.abs(creditFee) && <InsufficientCreditsModal/>}
                <CustomField
                    control={form.control}
                    name="title"
                    formLabel="Image Title"
                    className="w-full"
                    render={({ field }) => <Input {...field}
                        className="input-field" />}
                />

                {type === 'fill' && (
                    <CustomField
                    control={form.control}
                    name="aspectRatio"
                    formLabel="Aspect Ratio"
                    className="w-full"
                        render={({ field }) => (
                            <Select
                            onValueChange={(value)=>
                                onSelectFieldHandler(value, field.onChange)}
                                value={field.value}
                            
                            >
                                <SelectTrigger className="select-field">
                                    <SelectValue placeholder="Theme" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.keys(aspectRatioOptions).map((key) => (
                                        <SelectItem key={key} value={key} className="select-item">
                                            {aspectRatioOptions[key as AspectRatioKey].label}
                                            </SelectItem>                                            
                                    ))}
                                </SelectContent>
                            </Select>

                        )}
                    />
                )}

                {(type==='remove' || type === 'recolor') && (
                    <div className="promt-field">
                        <CustomField 
                        control={form.control}
                        name="prompt"
                        formLabel={
                            type === 'remove' ? 'Object to remove' : 'Object to recolor'
                        }
                        className="w-full"
                        render={({field})=>(
                            <Input
                            value={field.value}
                            className="input-field"
                            onChange={(e) => onInputChangeHandler(
                                'prompt',
                                e.target.value,
                                type,
                                field.onChange
                            )}

                            />
                        )}
                        />

                        {type === 'recolor' && (
                            <CustomField
                            control={form.control}
                            name="color"
                            formLabel="Replacement Color"
                            className="w-full"
                            render={({field}) => (
                                <Input
                                value={field.value}
                                className="input-field"
                                onChange={(e) => onInputChangeHandler(
                                    'color',
                                    e.target.value,
                                    'recolor',
                                    field.onChange
                                )}
    
                                />
                            )}
                            
                            />
                        )}
                    </div>
                )}

                <div className="media-uploader-field">
                    <CustomField
                    control={form.control}
                    name="publicId"
                    className="flex size-full flex-col"
                    render={({field})=>(
                        <MediaUploader
                            onValueChange={field.onChange}
                            setImage={setImage}
                            publicId={field.value}
                            image={image}
                            type={type}  
                        />
                    )}
                    />

                    <TransformedImage
                    image={image}
                    type={type}
                    title={form.getValues().title}
                    isTransforming={isTransforming}
                    setIsTransforming={setIsTransforming}
                    transformationConfig={transformationConfig}
                    />
                </div>

                <div className="flex flex-col gap-4">
                <Button type="submit"
                className="submit-button capitalize"
                disabled={isTransforming || newTransformation === null}
                onClick={onTransformHandler}
                >
                    {isTransforming ? 'Transforming...' : 'Apply Transformation'}
                </Button>

                <Button type="submit"
                className="submit-button capitalize"
                disabled={isSubmitting}
                >{isSubmitting ? 'Submitting...' : 'Save Image'}</Button>
                </div>
            </form>
        </Form> 
    )
}

export default TransformationForm
