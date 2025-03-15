import {
  Body,
  Controller,
  Ctx,
  CurrentUser,
  Delete,
  Flow,
  Get,
  Params,
  Post,
  Put,
} from 'amala'
import { Context } from 'koa'
import { MessageModel } from '@/models/Message'
import { UserModel } from '@/models/User'
import { verify } from '@/helpers/jwt'

async function authenticate(ctx: Context, next: () => Promise<void>) {
  const token = ctx.headers.authorization?.split(' ')[1]
  if (!token) {
    ctx.throw(401, 'Unauthorized')
    return // ❌ Return here to prevent the next middleware from running
  }

  try {
    const payload = verify(token)

    const user = await UserModel.findById(payload.id)
    if (!user) {
      ctx.throw(401, 'User not found')
      return // ❌ Return here to prevent the next middleware from running
    }

    ctx.state['user'] = user // ✅ Set the user in ctx.state
    await next()
  } catch (error) {
    ctx.throw(401, 'Invalid token')
  }
}

@Controller('/messages')
@Flow(authenticate)
export default class MessagesController {
  @Post('/')
  async createMessage(
    @Ctx() ctx: Context,
    @CurrentUser() user: any,
    @Body({ required: true }) { text }: { text: string }
  ) {
    if (!user) {
      ctx.throw(403, 'User not found')
      return // ❌ Return here to prevent the next code from running
    }

    console.log('✅ Creating message for user:', user)

    const message = await MessageModel.create({ text, sender: user._id })
    return message
  }

  @Get('/')
  async getAllMessages() {
    return MessageModel.find()
  }

  @Get('/:id')
  async getMessage(
    @Params('id') id: string,
    @CurrentUser() user: any,
    @Ctx() ctx: Context
  ) {
    const message = await MessageModel.findById(id).populate(
      'sender',
      'name email'
    )
    if (message && user.id !== message.sender.id) {
      ctx.throw(403, 'Not authorized')
      return
    }
    return message
  }

  @Put('/:id')
  async updateMessage(
    @Ctx() ctx: Context,
    @CurrentUser() user: any,
    @Params('id') id: string,
    @Body() { text }: { text: string }
  ) {
    const message = await MessageModel.findById(id)

    if (!message || message.sender.toString() !== user.id) {
      ctx.throw(403, 'Not authorized')
    }

    message.text = text
    await message.save()
    return message
  }

  @Delete('/:id')
  async deleteMessage(
    @Ctx() ctx: Context,
    @CurrentUser() user: any,
    @Params('id') id: string
  ) {
    const message = await MessageModel.findById(id)

    if (!message || message.sender.toString() !== user.id) {
      ctx.throw(403, 'Not authorized')
    }

    await message.deleteOne()
    return { success: true }
  }
}
