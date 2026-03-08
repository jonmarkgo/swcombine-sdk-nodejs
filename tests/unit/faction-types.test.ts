import { describe, expectTypeOf, it } from 'vitest';
import { FactionDetail, SWCombine } from '../../src/index.js';

type FactionGetResponse = Awaited<ReturnType<SWCombine['faction']['get']>>;

describe('Faction typing', () => {
  it('get() returns FactionDetail', () => {
    expectTypeOf<FactionGetResponse>().toEqualTypeOf<FactionDetail>();
  });

  it('supports the detailed faction payload shape', () => {
    const faction: FactionGetResponse = {
      attributes: {
        isbasic: 'true',
      },
      uid: '20:1840',
      name: 'Unnamed Market',
      parent: {},
      description: '<p>::: This holocron is currently encrypted...</p>',
      category: 'Modular',
      colour: {
        r: 0,
        g: 0,
        b: 0,
      },
      leader: {
        attributes: {
          uid: '1:1477410',
          href: 'https://www.swcombine.com/ws/v2.0/character/lucifer%20von%20kaldreon/',
        },
        value: 'Lucifer Von Kaldreon',
      },
      secondincommand: {
        attributes: {
          uid: '1:1467702',
          href: 'https://www.swcombine.com/ws/v2.0/character/marcinius%20turelles/',
        },
        value: 'Marcinius Turelles',
      },
      founded: {
        years: 26,
        days: 120,
        hours: 10,
        mins: 51,
        secs: 3,
        timestamp: '1742925063',
      },
      ircroom: 'https://discord.gg/ZPFU52MMCg',
      homepage: 'https://unnamed.market',
      recruitmentliaisons: [],
      datacards: {},
      subfactions: {},
      modules: {
        module: [
          {
            attributes: {
              uid: '173:1',
              href: 'https://www.swcombine.com/ws/v2.0/types/faction%20modules/faction/',
            },
            value: 'Faction',
          },
          {
            attributes: {
              uid: '173:2',
              href: 'https://www.swcombine.com/ws/v2.0/types/faction%20modules/diplomacy/',
            },
            value: 'Diplomacy',
          },
        ],
      },
      images: {
        logo: 'https://custom.swcombine.com/static/20/1840-logo.png?1752687787',
        horizontalbanner: 'https://custom.swcombine.com/static/20/1840-hbanner.png?1752687881',
        verticalbanner: 'https://i.imgur.com/0l6YTAN.gif',
      },
    };

    expectTypeOf(faction.attributes.isbasic).toEqualTypeOf<'true' | 'false' | undefined>();
    expectTypeOf(faction.modules.module?.[0]?.attributes?.uid).toEqualTypeOf<string | undefined>();
    expectTypeOf(faction.images.verticalbanner).toEqualTypeOf<string | undefined>();
  });
});
