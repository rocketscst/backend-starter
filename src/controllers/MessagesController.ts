import { Body, Controller, Ctx, Delete, Get, Params, Post, Put } from 'amala'
import { Context } from 'koa'
import { MessageModel } from '@/models/Message'
import { UserModel } from '@/models/User'
import { verify } from '@/helpers/jwt'

async function getAuthenticatedUser(ctx: Context) {
  const token = ctx.headers.authorization?.split(' ')[1]
  if (!token) {
    console.log('🚨 No token found in request headers')
    ctx.throw(401, 'Unauthorized')
  }

  try {
    const payload = verify(token)
    console.log('✅ Decoded Token:', payload)

    const user = await UserModel.findById(payload.id)
    if (!user) {
      console.log('🚨 User not found for token:', payload.id)
      ctx.throw(401, 'User not found')
    }

    ctx.state['user'] = user // ✅ Set the user in ctx.state
    console.log('✅ Authenticated user:', user)
    return user
  } catch (error) {
    console.log('🚨 Authentication failed:', error)
    ctx.throw(401, 'Invalid token')
  }
}

@Controller('/messages')
export default class MessagesController {
  @Post('/')
  async createMessage(
    @Ctx() ctx: Context,
    @Body({ required: true }) { text }: { text: string }
  ) {
    console.log('CTX STATE:', ctx.state)
    console.log('USER:', ctx.state['user'])
    console.log('USER ID:', ctx.state['user']?.id)

    // const user = await UserModel.findById(ctx.state['user'].id)
    const user = await getAuthenticatedUser(ctx)
    if (!user) {
      ctx.throw(403, 'User not found')
    }

    console.log('✅ Creating message for user:', user)

    const message = await MessageModel.create({ text, sender: user._id })
    return message
  }

  @Get('/')
  async getAllMessages() {
    return await MessageModel.find().populate('sender', 'name email')
  }

  @Get('/:id')
  async getMessage(@Params('id') id: string) {
    return await MessageModel.findById(id).populate('sender', 'name email')
  }

  @Put('/:id')
  async updateMessage(
    @Ctx() ctx: Context,
    @Params('id') id: string,
    @Body() { text }: { text: string }
  ) {
    const user = await getAuthenticatedUser(ctx)
    const message = await MessageModel.findById(id)

    if (!message || message.sender.toString() !== user.id) {
      ctx.throw(403, 'Not authorized')
    }

    message.text = text
    await message.save()
    return message
  }

  @Delete('/:id')
  async deleteMessage(@Ctx() ctx: Context, @Params('id') id: string) {
    const user = await getAuthenticatedUser(ctx)
    const message = await MessageModel.findById(id)

    if (!message || message.sender.toString() !== user.id) {
      ctx.throw(403, 'Not authorized')
    }

    await message.deleteOne()
    return { success: true }
  }
}
