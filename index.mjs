import fs from 'node:fs'
import path from 'node:path'

const DEFAULT_CONFIG = {
  enable: true
}

let currentConfig = { ...DEFAULT_CONFIG }

function loadConfig(ctx) {
  const configFilePath = ctx.configPath
  try {
    if (fs.existsSync(configFilePath)) {
      const raw = fs.readFileSync(configFilePath, 'utf-8')
      const loaded = JSON.parse(raw)
      currentConfig = { ...DEFAULT_CONFIG, ...loaded }
    } else {
      saveConfig(ctx, DEFAULT_CONFIG)
    }
  } catch {}
}

function saveConfig(ctx, newConfig) {
  currentConfig = { ...currentConfig, ...newConfig }
  const dir = path.dirname(ctx.configPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(
    ctx.configPath,
    JSON.stringify(currentConfig, null, 2),
    'utf-8'
  )
}

function buildConfigUI(ctx) {
  const { NapCatConfig } = ctx
  return NapCatConfig.combine(
    NapCatConfig.html('<h3>🐔 群头衔设置</h3>'),

    NapCatConfig.boolean(
      'enable',
      '启用头衔指令',
      DEFAULT_CONFIG.enable,
      '开启后可使用 我要头衔 xxx或我要头衔xxx'
    )
  )
}

async function callOB11(ctx, action, params) {
  return await ctx.actions.call(
    action,
    params,
    ctx.adapterName,
    ctx.pluginManager.config
  )
}

async function onMessage(ctx, event) {
  if (!currentConfig.enable) return
  if (event.message_type !== 'group') return

  const msg = event.raw_message?.trim() || ''
  if (!msg.startsWith('我要头衔')) return

  const title = msg.replace('我要头衔', '').trim()
  if (!title) return

  await callOB11(ctx, 'set_group_special_title', {
    group_id: event.group_id,
    user_id: event.user_id,
    special_title: title,
    duration: 0
  })
}

let plugin_config_ui = []

async function plugin_init(ctx) {
  loadConfig(ctx)
  plugin_config_ui = buildConfigUI(ctx)
}

async function plugin_get_config() {
  return currentConfig
}

function plugin_on_config_change(ctx, _, key, value) {
  saveConfig(ctx, { [key]: value })
}

const plugin_onmessage = onMessage

export {
  plugin_init,
  plugin_get_config,
  plugin_on_config_change,
  plugin_config_ui,
  plugin_onmessage
}