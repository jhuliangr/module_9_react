import z from 'zod';

export const AchivementSchema = z.object({
  id: z.string(),
  name: z.string(),
  condition: z.object({
    type: z.string(),
    value: z.number(),
  }),
});

export type Achivement = z.infer<typeof AchivementSchema>;

export const GameRulesSchema = z.object({
  speed: z.number(),
  attackRange: z.number(),
  baseHp: z.number(),
  baseSwordDamage: z.number(),
  tickMs: z.number(),
  xpPerKill: z.number(),
});

export type GameRules = z.infer<typeof GameRulesSchema>;

export const SkinSchema = z.object({
  id: z.string(),
  name: z.string(),
  unlockCondition: z
    .object({
      type: z.string(),
      value: z.number(),
    })
    .nullable(),
});

export type Skin = z.infer<typeof SkinSchema>;

export const WeaponSchema = z.object({
  id: z.string(),
  name: z.string(),
  unlockCondition: z
    .object({
      type: z.string(),
      value: z.number(),
    })
    .nullable(),
});

export type Weapon = z.infer<typeof WeaponSchema>;

export const GetGameServerInfoResponseSchema = z.object({
  achievements: z.array(AchivementSchema),
  gameRules: GameRulesSchema,
  skins: z.array(SkinSchema),
  weapons: z.array(WeaponSchema),
});

export type GetGameServerInfoResponse = z.infer<
  typeof GetGameServerInfoResponseSchema
>;
