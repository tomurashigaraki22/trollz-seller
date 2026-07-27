// Category-specific attribute schema for the seller product form. Keyed by
// the exact top-level category names used across Trollz Store (Fashion,
// Phones & Tablets, Computing, Health & Beauty, Home and Office, Groceries,
// Trollz.tm), so a seller picking "Fashion" naturally sees size/color while
// one picking "Phones & Tablets" sees storage/RAM/condition instead.

const COLOR_OPTIONS = [
  "Black",
  "White",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Pink",
  "Purple",
  "Orange",
  "Brown",
  "Grey",
  "Gold",
  "Silver",
  "Multicolor",
];

const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const SHOE_SIZES = ["38", "39", "40", "41", "42", "43", "44", "45", "46"];
const STORAGE_OPTIONS = ["16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "2TB"];
const RAM_OPTIONS = ["1GB", "2GB", "3GB", "4GB", "6GB", "8GB", "12GB", "16GB", "32GB"];
const CONDITION_OPTIONS = ["New", "UK Used", "Nigerian Used", "Refurbished"];

export const CATEGORY_FIELDS = {
  Fashion: [
    { key: "sizes", label: "Available Sizes", type: "multiselect", options: CLOTHING_SIZES },
    { key: "colors", label: "Available Colors", type: "multiselect", options: COLOR_OPTIONS },
    { key: "material", label: "Material", type: "text", placeholder: "e.g. Cotton, Lace, Denim" },
    { key: "gender", label: "Gender", type: "select", options: ["Unisex", "Men", "Women", "Kids"] },
  ],
  "Phones & Tablets": [
    { key: "brand", label: "Brand", type: "text", placeholder: "e.g. Samsung, Apple, Tecno" },
    { key: "model", label: "Model", type: "text", placeholder: "e.g. Galaxy A15" },
    { key: "storage", label: "Storage", type: "select", options: STORAGE_OPTIONS },
    { key: "ram", label: "RAM", type: "select", options: RAM_OPTIONS },
    { key: "colors", label: "Available Colors", type: "multiselect", options: COLOR_OPTIONS },
    { key: "condition", label: "Condition", type: "select", options: CONDITION_OPTIONS },
    { key: "warranty", label: "Warranty", type: "text", placeholder: "e.g. 6 months" },
  ],
  Computing: [
    { key: "brand", label: "Brand", type: "text", placeholder: "e.g. HP, Dell, Lenovo" },
    { key: "model", label: "Model", type: "text" },
    { key: "processor", label: "Processor", type: "text", placeholder: "e.g. Intel Core i5, Ryzen 5" },
    { key: "ram", label: "RAM", type: "select", options: RAM_OPTIONS },
    { key: "storage", label: "Storage", type: "text", placeholder: "e.g. 512GB SSD, 1TB HDD" },
    { key: "screenSize", label: "Screen Size", type: "text", placeholder: "e.g. 15.6 inches" },
    { key: "condition", label: "Condition", type: "select", options: CONDITION_OPTIONS },
    { key: "warranty", label: "Warranty", type: "text", placeholder: "e.g. 1 year" },
  ],
  "Health & Beauty": [
    { key: "brand", label: "Brand", type: "text" },
    { key: "volume", label: "Size / Volume", type: "text", placeholder: "e.g. 50ml, 200g" },
    {
      key: "skinType",
      label: "Skin / Hair Type",
      type: "select",
      options: ["All Types", "Oily", "Dry", "Combination", "Sensitive"],
    },
    { key: "expiryDate", label: "Expiry Date", type: "date" },
  ],
  "Home and Office": [
    { key: "brand", label: "Brand", type: "text" },
    { key: "material", label: "Material", type: "text", placeholder: "e.g. Wood, Steel, Fabric" },
    { key: "dimensions", label: "Dimensions", type: "text", placeholder: "e.g. 120 x 60 x 75 cm" },
    { key: "colors", label: "Available Colors", type: "multiselect", options: COLOR_OPTIONS },
  ],
  Groceries: [
    { key: "brand", label: "Brand", type: "text" },
    { key: "weightVolume", label: "Weight / Volume", type: "text", placeholder: "e.g. 1kg, 500ml, 6 pack" },
    { key: "expiryDate", label: "Expiry Date", type: "date" },
  ],
  "Trollz.tm": [
    { key: "brand", label: "Brand", type: "text" },
    { key: "material", label: "Material", type: "text" },
    { key: "colors", label: "Available Colors", type: "multiselect", options: COLOR_OPTIONS },
  ],
};

const DEFAULT_FIELDS = [
  { key: "brand", label: "Brand", type: "text" },
  { key: "colors", label: "Available Colors", type: "multiselect", options: COLOR_OPTIONS },
];

export function getCategoryFields(categoryName) {
  return CATEGORY_FIELDS[categoryName] ?? DEFAULT_FIELDS;
}

// Footwear needs shoe sizes, not clothing sizes — swap the "sizes" field's
// options when the subcategory looks shoe-related.
export function resolveFieldOptions(field, subcategoryName) {
  if (field.key !== "sizes") return field.options;
  const isFootwear = /shoe|footwear|sneaker|sandal|slipper|boot/i.test(subcategoryName ?? "");
  return isFootwear ? SHOE_SIZES : field.options;
}

// Turns the filled-in dynamic attribute values into a readable spec block.
// Appended to the product description so the details are always visible on
// the product page even if the storefront backend has no dedicated columns
// for them.
export function buildSpecsText(fields, values) {
  const lines = fields
    .map((field) => {
      const value = values[field.key];
      if (Array.isArray(value)) {
        return value.length > 0 ? `${field.label}: ${value.join(", ")}` : null;
      }
      return value ? `${field.label}: ${value}` : null;
    })
    .filter(Boolean);

  return lines.join("\n");
}
