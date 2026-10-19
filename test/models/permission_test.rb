require "test_helper"

class PermissionTest < ActiveSupport::TestCase
  test "seed creates the catalogue and is safe to re-run" do
    Permission.delete_all

    created = Permission.seed
    assert_equal Permission::CATALOGUE.values.sum(&:size), created
    assert_equal 0, Permission.seed
    assert_equal "Approve a version", Permission.find_by!(name: "reviews.approve").description
  end

  test "obsolete lists rows the catalogue no longer has" do
    stale = Permission.create!(name: "widgets.index", resource: "widgets", action: "index")

    assert_equal [ stale ], Permission.obsolete.to_a
  end

  test "catalogue groups by resource" do
    catalogue = Permission.catalogue

    assert_equal Permission::CATALOGUE.keys.sort, catalogue.keys.sort
    assert_includes catalogue["reviews"].map { it["name"] }, "reviews.approve"
  end
end
