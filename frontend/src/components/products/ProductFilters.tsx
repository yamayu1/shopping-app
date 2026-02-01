import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  TextField,
  Button,
  Chip,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { ExpandMore, Clear } from '@mui/icons-material';
import { Category, ProductFilters as ProductFiltersType } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import { PRODUCT_SORT_OPTIONS } from '../../utils/constants';

interface ProductFiltersProps {
  categories: Category[];
  filters: ProductFiltersType;
  onFiltersChange: (filters: ProductFiltersType) => void;
  onClearFilters: () => void;
  priceRange: { min: number; max: number };
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  filters,
  onFiltersChange,
  onClearFilters,
  priceRange,
}) => {
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>([
    filters.min_price || priceRange.min,
    filters.max_price || priceRange.max,
  ]);

  useEffect(() => {
    setLocalPriceRange([
      filters.min_price || priceRange.min,
      filters.max_price || priceRange.max,
    ]);
  }, [filters.min_price, filters.max_price, priceRange]);

  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    onFiltersChange({
      ...filters,
      category_id: checked ? categoryId : undefined,
    });
  };

  const handlePriceRangeChange = (event: Event, newValue: number | number[]) => {
    const value = newValue as [number, number];
    setLocalPriceRange(value);
  };

  const handlePriceRangeCommitted = () => {
    onFiltersChange({
      ...filters,
      min_price: localPriceRange[0],
      max_price: localPriceRange[1],
    });
  };

  const handleSortChange = (sortValue: string) => {
    const [sort_by, sort_order] = sortValue.split('-') as [string, 'asc' | 'desc'];
    onFiltersChange({
      ...filters,
      sort_by: sort_by as any,
      sort_order,
    });
  };

  const handleFeaturedChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      featured: checked ? true : undefined,
    });
  };

  const handleInStockChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      in_stock: checked ? true : undefined,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category_id) count++;
    if (filters.min_price || filters.max_price) count++;
    if (filters.featured) count++;
    if (filters.in_stock) count++;
    return count;
  };

  const getSortValue = () => {
    if (filters.sort_by && filters.sort_order) {
      return `${filters.sort_by}-${filters.sort_order}`;
    }
    return 'created_at-desc';
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Filters
          {getActiveFiltersCount() > 0 && (
            <Chip
              label={getActiveFiltersCount()}
              size="small"
              color="primary"
              sx={{ ml: 1 }}
            />
          )}
        </Typography>
        <Button
          startIcon={<Clear />}
          onClick={onClearFilters}
          size="small"
          disabled={getActiveFiltersCount() === 0}
        >
          Clear All
        </Button>
      </Box>

      {/* Sort */}
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Sort By</InputLabel>
          <Select
            value={getSortValue()}
            label="Sort By"
            onChange={(e) => handleSortChange(e.target.value)}
          >
            {PRODUCT_SORT_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Categories */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            Categories
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormGroup>
            {categories.map((category) => (
              <FormControlLabel
                key={category.id}
                control={
                  <Checkbox
                    checked={filters.category_id === category.id}
                    onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>{category.name}</span>
                    {category.products_count && (
                      <span style={{ color: '#666' }}>({category.products_count})</span>
                    )}
                  </Box>
                }
                sx={{ width: '100%' }}
              />
            ))}
          </FormGroup>
        </AccordionDetails>
      </Accordion>

      {/* Price Range */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            Price Range
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ px: 1 }}>
            <Slider
              value={localPriceRange}
              onChange={handlePriceRangeChange}
              onChangeCommitted={handlePriceRangeCommitted}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => formatCurrency(value)}
              min={priceRange.min}
              max={priceRange.max}
              step={1}
              marks={[
                { value: priceRange.min, label: formatCurrency(priceRange.min) },
                { value: priceRange.max, label: formatCurrency(priceRange.max) },
              ]}
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <TextField
                label="Min"
                type="number"
                size="small"
                value={localPriceRange[0]}
                onChange={(e) => {
                  const value = Math.max(priceRange.min, Number(e.target.value));
                  setLocalPriceRange([value, localPriceRange[1]]);
                }}
                onBlur={handlePriceRangeCommitted}
                InputProps={{
                  startAdornment: '$',
                }}
              />
              <TextField
                label="Max"
                type="number"
                size="small"
                value={localPriceRange[1]}
                onChange={(e) => {
                  const value = Math.min(priceRange.max, Number(e.target.value));
                  setLocalPriceRange([localPriceRange[0], value]);
                }}
                onBlur={handlePriceRangeCommitted}
                InputProps={{
                  startAdornment: '$',
                }}
              />
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Additional Filters */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            Additional Filters
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.featured || false}
                  onChange={(e) => handleFeaturedChange(e.target.checked)}
                />
              }
              label="Featured Products"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.in_stock || false}
                  onChange={(e) => handleInStockChange(e.target.checked)}
                />
              }
              label="In Stock Only"
            />
          </FormGroup>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default ProductFilters;