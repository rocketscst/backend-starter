import { getModelForClass, modelOptions, prop, Ref } from '@typegoose/typegoose'
import { User } from '@/models/User'

@modelOptions({ schemaOptions: { timestamps: true } })
export class Message {
  @prop({ required: true })
  text!: string

  @prop({ ref: () => User, required: true })
  sender!: Ref<User>
}

export const MessageModel = getModelForClass(Message)
