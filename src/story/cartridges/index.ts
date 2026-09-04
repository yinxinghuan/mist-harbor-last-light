import { mistHarborLastLight, mistHarborLastLightEn } from './mistHarborLastLight'
import type { Locale, StoryCartridge } from '../types'

export const DEFAULT_CARTRIDGE_ID = 'mist-harbor-last-light'
export const CARTRIDGES: Record<string, StoryCartridge> = { 'mist-harbor-last-light': mistHarborLastLight }
export const CARTRIDGES_EN: Record<string, StoryCartridge> = { 'mist-harbor-last-light': mistHarborLastLightEn }
export function listCartridges(locale: Locale): StoryCartridge[] { return [locale === 'en' ? mistHarborLastLightEn : mistHarborLastLight] }
export function resolveCartridge(_id: string | null | undefined, locale: Locale = 'zh'): StoryCartridge { return locale === 'en' ? mistHarborLastLightEn : mistHarborLastLight }
