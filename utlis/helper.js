// helper.js
export const transformData = (mysqlRows) => {
  const batchSet = new Set();

  return mysqlRows
    .map((row) => {
      // Handle column name variations
      const qrcode = row.QRCode || row.qrcode || row.QrCode;
      const ageing = row.Ageing || row.ageing;
      const productionUnitCode =
        row.ProductionUnitCode || row.productionunitcode;
      const shift = row.Shift || row.shift;

      if (!qrcode || batchSet.has(qrcode)) return null;
      batchSet.add(qrcode);

      return {
        batch: qrcode,
        material: row.material || row.Material,
        work_center: productionUnitCode,
        actual_shift: shift,
        quality_status: row.quality_status || row.QualityStatus,
        compound_age: ageing,
        created_at: row.created_at || row.CreatedAt,
      };
    })
    .filter(Boolean);
};

export const validateDocuments = (documents) => {
  const requiredFields = [
    "batch",
    "material",
    "work_center",
    "quality_status",
    "compound_age",
    "actual_shift",
    "created_at",
  ];

  const validDocs = documents.filter((doc) =>
    requiredFields.every(
      (field) => doc[field] !== undefined && doc[field] !== null
    )
  );

  console.log(
    `Validation: ${documents.length} -> ${validDocs.length} valid documents`
  );
  return validDocs;
};

export const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};
