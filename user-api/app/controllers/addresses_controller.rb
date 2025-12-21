class AddressesController < ApplicationController
  before_action :set_address, only: [:show, :update, :destroy]

  def index
    @addresses = current_user.addresses.order(:is_default, :created_at)
    
    render_success({
      addresses: @addresses.map { |address| address_data(address) }
    })
  end

  def show
    render_success({
      address: address_data(@address)
    })
  end

  def create
    @address = current_user.addresses.build(address_params)
    
    if @address.save
      @address.set_as_default if params[:is_default] == true || current_user.addresses.count == 1
      
      render_success({
        address: address_data(@address)
      }, 'Address created successfully', :created)
    else
      render_error('Address creation failed', :unprocessable_entity, @address.errors.full_messages)
    end
  end

  def update
    if @address.update(address_params)
      @address.set_as_default if params[:is_default] == true
      
      render_success({
        address: address_data(@address)
      }, 'Address updated successfully')
    else
      render_error('Address update failed', :unprocessable_entity, @address.errors.full_messages)
    end
  end

  def set_default
    @address = current_user.addresses.find(params[:id])
    @address.set_as_default

    render_success({
      address: address_data(@address)
    }, 'Default address updated successfully')
  end

  def destroy
    if @address.orders.exists?
      render_error('Cannot delete address with existing orders', :bad_request)
    else
      @address.destroy
      render_success({}, 'Address deleted successfully')
    end
  end

  private

  def set_address
    @address = current_user.addresses.find(params[:id])
  end

  def address_params
    params.permit(:name, :postal_code, :state, :city, :address_line_1, :address_line_2, :phone)
  end

  def address_data(address)
    {
      id: address.id,
      name: address.name,
      postal_code: address.postal_code,
      state: address.state,
      city: address.city,
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2,
      full_address: address.full_address,
      phone: address.phone,
      is_default: address.is_default,
      created_at: address.created_at
    }
  end
end