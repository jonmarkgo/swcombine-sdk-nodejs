import { describe, expectTypeOf, it } from 'vitest';
import { Message, MessageListItem, SWCombine } from '../../src/index.js';

type MessageListResponse = Awaited<ReturnType<SWCombine['character']['messages']['list']>>;
type MessageGetResponse = Awaited<ReturnType<SWCombine['character']['messages']['get']>>;
type MessageCreateResponse = Awaited<ReturnType<SWCombine['character']['messages']['create']>>;

describe('Character.messages typing', () => {
  it('list() returns MessageListItem[]', () => {
    expectTypeOf<MessageListResponse>().toEqualTypeOf<MessageListItem[]>();
  });

  it('get() returns Message', () => {
    expectTypeOf<MessageGetResponse>().toEqualTypeOf<Message>();
  });

  it('create() return type remains Message', () => {
    expectTypeOf<MessageCreateResponse>().toEqualTypeOf<Message>();
  });

  it('list item shape requires attributes, sender, receiver, and time', () => {
    const listItem: MessageListItem = {
      attributes: {
        uid: '38:105138990',
        href: 'https://www.swcombine.com/ws/v2.0/character/marcinius%20turelles/messages/38%3A105138990/',
      },
      sender: {
        attributes: {
          uid: '1:1467702',
          href: 'https://www.swcombine.com/ws/v2.0/character/marcinius%20turelles/',
        },
        value: 'Marcinius Turelles',
      },
      receiver: {
        attributes: {
          uid: '1:1467702',
          href: 'https://www.swcombine.com/ws/v2.0/character/marcinius%20turelles/',
        },
        value: 'Marcinius Turelles',
      },
      time: {
        years: 27,
        days: 88,
        hours: 5,
        mins: 12,
        secs: 14,
        timestamp: '1771675934',
      },
    };

    expectTypeOf(listItem.attributes.uid).toEqualTypeOf<string>();
    expectTypeOf(listItem.sender.value).toEqualTypeOf<string>();
    expectTypeOf(listItem.receiver.value).toEqualTypeOf<string>();
    expectTypeOf(listItem.time.timestamp).toEqualTypeOf<string>();
  });

  it('message detail shape requires uid, sender, receiver, time, and communication', () => {
    const message: Message = {
      uid: '38:105138990',
      sender: {
        attributes: {
          uid: '1:1467702',
          href: 'https://www.swcombine.com/ws/v2.0/character/marcinius%20turelles/',
        },
        value: 'Marcinius Turelles',
      },
      receiver: {
        attributes: {
          uid: '1:1467702',
          href: 'https://www.swcombine.com/ws/v2.0/character/marcinius%20turelles/',
        },
        value: 'Marcinius Turelles',
      },
      time: {
        years: 27,
        days: 88,
        hours: 5,
        mins: 12,
        secs: 14,
        timestamp: '1771675934',
      },
      communication: 'Test',
    };

    expectTypeOf(message.uid).toEqualTypeOf<string>();
    expectTypeOf(message.communication).toEqualTypeOf<string>();
    expectTypeOf(message.time.timestamp).toEqualTypeOf<string>();
  });
});
