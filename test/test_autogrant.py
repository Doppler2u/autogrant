from gltest import get_contract_factory, default_account
from gltest.helpers import load_fixture
from gltest.assertions import tx_execution_succeeded

def deploy_contract():
    factory = get_contract_factory("AutoGrant")
    contract = factory.deploy(args=[70])
    return contract

def test_autogrant_flow():
    contract = load_fixture(deploy_contract)

    # Note: Replace with real URLs for testing
    github_url = "https://github.com/genlayerlabs/genvm"
    project_url = "https://genlayer.com"
    
    app_id = f"{default_account.address}_{github_url}".lower()

    # Create App
    submit_result = contract.submit_application(args=[github_url, project_url])
    assert tx_execution_succeeded(submit_result)

    # Evaluate App
    eval_result = contract.evaluate_application(
        args=[app_id],
        wait_interval=10000,
        wait_retries=15,
    )
    assert tx_execution_succeeded(eval_result)

    # Get Result
    app = contract.get_application(args=[app_id])
    assert app["is_evaluated"] == True
    assert app["score"] >= 0
