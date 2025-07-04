import AsyncSelect from 'react-select/async'
import PropTypes from 'prop-types'
import api from '../utils/api'

export default function ProductSelect({ value, onChange, placeholder = "Pilih produk...", disableOutOfStock = true }) {
  // Load options based on search input
  const loadOptions = async (inputValue) => {
    try {
      // Only search if input has at least 2 characters
      if (inputValue.length < 2) {
        return []
      }
      
      const response = await api.get('/api/products', {
        params: {
          search: inputValue,
          limit: 20 // Limit results for better performance
        }
      })
      
      const products = response.data.data || []
      
      return products.map(product => {
        const stock = product.current_stock
        let stockStatus = ''
        let stockColor = ''
        
        if (stock <= 0) {
          stockStatus = 'Stok habis'
          stockColor = '#ef4444' // red
        } else if (stock <= 10) {
          stockStatus = `Stok: ${stock}`
          stockColor = '#f59e0b' // yellow
        } else {
          stockStatus = `Stok: ${stock}`
          stockColor = '#10b981' // green
        }
        
        return {
          value: product.code,
          label: `${product.code} - ${product.name}`,
          product: product,
          stockStatus,
          stockColor,
          isDisabled: disableOutOfStock && stock <= 0
        }
      })
    } catch (error) {
      console.error('Error loading products:', error)
      return []
    }
  }

  const handleChange = (selectedOption) => {
    if (selectedOption && !selectedOption.isDisabled) {
      onChange(selectedOption.product)
    } else {
      onChange(null)
    }
  }

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '42px',
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.1)' : 'none',
      '&:hover': {
        borderColor: '#3b82f6'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#3b82f6' 
        : state.isFocused 
        ? '#eff6ff' 
        : 'white',
      color: state.isSelected ? 'white' : '#374151',
      opacity: state.data.isDisabled ? 0.5 : 1,
      cursor: state.data.isDisabled ? 'not-allowed' : 'default',
      '&:hover': {
        backgroundColor: state.isSelected ? '#3b82f6' : '#eff6ff'
      }
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af'
    }),
    singleValue: (provided, state) => ({
      ...provided,
      color: state.data?.isDisabled ? '#9ca3af' : '#374151'
    })
  }

  const formatOptionLabel = ({ label, stockStatus, stockColor, isDisabled }) => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      opacity: isDisabled ? 0.5 : 1
    }}>
      <span>{label}</span>
      <span style={{ 
        color: stockColor, 
        fontSize: '0.875rem', 
        fontWeight: '500',
        marginLeft: '8px'
      }}>
        {stockStatus}
      </span>
    </div>
  )

  return (
    <AsyncSelect
      loadOptions={loadOptions}
      value={value ? { value, label: value } : null}
      onChange={handleChange}
      placeholder={placeholder}
      isSearchable
      isClearable
      styles={customStyles}
      formatOptionLabel={formatOptionLabel}
      className="react-select-container"
      classNamePrefix="react-select"
      noOptionsMessage={() => "Ketik minimal 2 karakter untuk mencari produk"}
      loadingMessage={() => "Mencari produk..."}
      isOptionDisabled={(option) => option.isDisabled}
      cacheOptions
      defaultOptions={false}
      debounceTimeout={300} // Debounce search requests
    />
  )
}

ProductSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  disableOutOfStock: PropTypes.bool
}