class ProfilesController < ApplicationController
  def show
    render_success({
      user: user_data(current_user)
    })
  end

  def update
    if current_user.update(profile_params)
      render_success({
        user: user_data(current_user)
      }, 'Profile updated successfully')
    else
      render_error('Profile update failed', :unprocessable_entity, current_user.errors.full_messages)
    end
  end

  private

  def profile_params
    params.permit(:first_name, :last_name, :phone, :birth_date)
  end

  def user_data(user)
    {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: user.full_name,
      phone: user.phone,
      birth_date: user.birth_date,
      created_at: user.created_at
    }
  end
end