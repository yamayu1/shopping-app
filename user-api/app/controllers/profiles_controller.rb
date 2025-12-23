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
end