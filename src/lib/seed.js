import { BoxDB, SiteDB } from './db.js'

export async function seedDemoData() {
  const sites = [
    { name: '北京站', orderIndex: 1 },
    { name: '上海站', orderIndex: 2 },
    { name: '广州站', orderIndex: 3 },
    { name: '深圳站', orderIndex: 4 }
  ]

  await SiteDB.clear()
  for (const s of sites) await SiteDB.add(s)

  await BoxDB.clear()

  const demoBoxes = [
    {
      boxNumber: 'BX-A001',
      siteName: '北京站',
      orderIndex: 1,
      summary: '主背板、易拉宝 3 个',
      timeSlot: '08:00-10:00',
      riskLevel: 'high',
      responsible: '张明',
      status: 'arrived',
      checkNote: '已签收，箱角有轻微磕碰，已记录',
      remark: '含易碎标识'
    },
    {
      boxNumber: 'BX-A002',
      siteName: '北京站',
      orderIndex: 2,
      summary: 'LED 屏控制箱',
      timeSlot: '08:00-10:00',
      riskLevel: 'high',
      responsible: '李强',
      status: 'arrived',
      checkNote: '设备完好，通电测试通过'
    },
    {
      boxNumber: 'BX-A003',
      siteName: '北京站',
      orderIndex: 3,
      summary: '宣传册 500 份',
      timeSlot: '10:00-12:00',
      riskLevel: 'low',
      responsible: '',
      status: 'arrived',
      checkNote: ''
    },
    {
      boxNumber: 'BX-A001',
      siteName: '上海站',
      orderIndex: 4,
      summary: '主背板、易拉宝 3 个',
      timeSlot: '08:00-10:00',
      riskLevel: 'high',
      responsible: '王芳',
      status: 'transit',
      checkNote: ''
    },
    {
      boxNumber: 'BX-A004',
      siteName: '上海站',
      orderIndex: 5,
      summary: '互动展台组件',
      timeSlot: '10:00-12:00',
      riskLevel: 'medium',
      responsible: '王芳',
      status: 'transit',
      checkNote: ''
    },
    {
      boxNumber: 'BX-A005',
      siteName: '上海站',
      orderIndex: 6,
      summary: '赠品套装 200 套',
      timeSlot: '12:00-14:00',
      riskLevel: 'low',
      responsible: '王芳',
      status: 'pending',
      checkNote: ''
    },
    {
      boxNumber: 'BX-A006',
      siteName: '上海站',
      orderIndex: 7,
      summary: '灯光控制器',
      timeSlot: '14:00-16:00',
      riskLevel: 'high',
      responsible: '李强',
      status: 'pending',
      checkNote: ''
    },
    {
      boxNumber: 'BX-A007',
      siteName: '上海站',
      orderIndex: 8,
      summary: '电源箱 2 套',
      timeSlot: '14:00-16:00',
      riskLevel: 'high',
      responsible: '李强',
      status: 'supplement',
      checkNote: '',
      remark: '缺少 1 个航空插头，待补发'
    },
    {
      boxNumber: 'BX-B001',
      siteName: '广州站',
      orderIndex: 9,
      summary: '主背板复刻版',
      timeSlot: '08:00-10:00',
      riskLevel: 'medium',
      responsible: '陈磊',
      status: 'pending',
      checkNote: ''
    },
    {
      boxNumber: 'BX-B002',
      siteName: '广州站',
      orderIndex: 10,
      summary: '展示架 6 组',
      timeSlot: '10:00-12:00',
      riskLevel: 'low',
      responsible: '陈磊',
      status: 'pending',
      checkNote: ''
    }
  ]

  await BoxDB.bulkAdd(demoBoxes)
  return true
}
