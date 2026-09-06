export interface DataSource {
  id: string;
  name: string;
  type: 'Database' | 'API' | 'Stream' | 'File' | 'Web App';
  status: 'connected' | 'error' | 'syncing';
  lastSync: string;
  frequency: string;
  objects: { objectId: string; fieldMappings: { source: string; target: string; transform?: string }[] }[];
  icon: string;
  color: string;
  endpoint?: string;
}

export const dataSources: DataSource[] = [
  {
    id: 'sap', name: 'SAP ERP', type: 'Database', status: 'connected', lastSync: '2 min ago', frequency: 'Incremental / 5min',
    icon: '🗄️', color: '#3b82f6', endpoint: 'sap-erp.prod:3306/MDM',
    objects: [
      { objectId: 'raw-material', fieldMappings: [
        { source: 'MATNR', target: 'materialCode', transform: 'prefix "RM-"' },
        { source: 'MAKTX', target: 'name' },
        { source: 'MEINS', target: 'unit' },
        { source: 'LABST', target: 'stockLevel', transform: 'cast Decimal' },
      ]},
      { objectId: 'supplier', fieldMappings: [
        { source: 'LIFNR', target: 'supplierCode', transform: 'prefix "SUP-"' },
        { source: 'NAME1', target: 'name' },
        { source: 'REGIO', target: 'region' },
        { source: 'STCEG', target: 'taxId' },
      ]},
      { objectId: 'purchase-order', fieldMappings: [
        { source: 'EBELN', target: 'poNumber' },
        { source: 'LIFNR', target: 'supplier', transform: 'lookup Supplier' },
        { source: 'NETWR', target: 'amount', transform: 'cast Decimal' },
        { source: 'STATU', target: 'status', transform: 'map SAP status' },
      ]},
      { objectId: 'product', fieldMappings: [
        { source: 'MATNR', target: 'sku', transform: 'prefix "PRD-"' },
        { source: 'MAKTX', target: 'name' },
        { source: 'MATKL', target: 'category' },
      ]},
    ],
  },
  {
    id: 'wms', name: 'WMS', type: 'Database', status: 'connected', lastSync: '5 min ago', frequency: 'Incremental / 15min',
    icon: '📦', color: '#10b981', endpoint: 'wms-db.prod:5432/inventory',
    objects: [
      { objectId: 'raw-material', fieldMappings: [
        { source: 'item_id', target: 'materialCode' },
        { source: 'warehouse_qty', target: 'stockLevel' },
        { source: 'reorder_point', target: 'minThreshold' },
      ]},
    ],
  },
  {
    id: 'mes', name: 'MES System', type: 'API', status: 'connected', lastSync: '30 min ago', frequency: 'On-change event',
    icon: '⚙️', color: '#f59e0b', endpoint: 'https://mes.prod/api/v2',
    objects: [
      { objectId: 'production-line', fieldMappings: [
        { source: 'line_id', target: 'lineCode' },
        { source: 'line_name', target: 'name' },
        { source: 'max_capacity', target: 'capacity', transform: 'unit: units/day' },
        { source: 'current_state', target: 'status', transform: 'map state enum' },
        { source: 'util_pct', target: 'utilization', transform: 'percentage' },
      ]},
    ],
  },
  {
    id: 'plm', name: 'PLM', type: 'API', status: 'connected', lastSync: '1 hour ago', frequency: 'Nightly batch',
    icon: '📐', color: '#8b5cf6', endpoint: 'https://plm.prod/api/bom',
    objects: [
      { objectId: 'product', fieldMappings: [
        { source: 'part_number', target: 'sku' },
        { source: 'part_name', target: 'name' },
        { source: 'product_family', target: 'category' },
      ]},
      { objectId: 'bill-of-materials', fieldMappings: [
        { source: 'bom_id', target: 'bomCode' },
        { source: 'parent_part', target: 'product', transform: 'lookup Product' },
        { source: 'comp_part', target: 'components', transform: 'join Material' },
        { source: 'qty_per', target: 'quantity', transform: 'cast Decimal' },
      ]},
    ],
  },
  {
    id: 'supplier-portal', name: 'Supplier Portal', type: 'Web App', status: 'connected', lastSync: '1 hour ago', frequency: 'Manual / Webhook',
    icon: '🌐', color: '#ec4899', endpoint: 'https://suppliers.prod/export',
    objects: [
      { objectId: 'supplier', fieldMappings: [
        { source: 'vendor_id', target: 'supplierCode' },
        { source: 'company_name', target: 'name' },
        { source: 'country', target: 'region' },
        { source: 'compliance_score', target: 'reliabilityScore', transform: 'cast Int 0-100' },
      ]},
    ],
  },
  {
    id: 'kafka', name: 'Kafka Event Stream', type: 'Stream', status: 'syncing', lastSync: '实时', frequency: 'Continuous',
    icon: '📡', color: '#ef4444', endpoint: 'kafka.prod:9092/topic.supply.events',
    objects: [
      { objectId: 'supply-disruption', fieldMappings: [
        { source: 'event.disruption_id', target: 'disruptionCode' },
        { source: 'event.severity', target: 'severity', transform: 'enum map' },
        { source: 'event.material_id', target: 'affectedMaterials', transform: 'split array' },
        { source: 'event.timestamp', target: 'detectedAt', transform: 'ISO 8601 parse' },
        { source: 'event.description', target: 'description' },
      ]},
    ],
  },
];
