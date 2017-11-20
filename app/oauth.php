<?php

// INCLUDE LIBS

require('OAuth2/client.php');
require('OAuth2/GrantType/IGrantType.php');
require('OAuth2/GrantType/AuthorizationCode.php');

// SET URL PARAMS

$client_id       = 'YOUR CLIENT KEY';
$client_secret   = 'YOUR SECRET KEY';
$state           = 'test';

$scope           = 'wow.profile'; // FETCH WOW DATA

$redirect_uri    = 'https://localhost';
$authorize_uri   = 'https://eu.battle.net/oauth/authorize';
$token_uri       = 'https://eu.battle.net/oauth/token';

// CREATE NEW OAUTH2

$client = new OAuth2\Client($client_id, $client_secret);

// IF NO CODE PARAM REQUEST TOKEN

if (!isset($_GET['code'])) {
    $auth_url = $authorize_uri.'?client_id='.$client_id.'&scope='.$scope.'&state='.$state.'&redirect_uri='.$redirect_uri.'&response_type=code';
    header('Location: ' . $auth_url);

    die('Redirect');
}
else {
	// ESLE GET TOKEN AND ACCESS DATA
	$params = array('code' => $_GET['code'], 'redirect_uri' => $redirect_uri);
    $response = $client->getAccessToken($token_uri, 'authorization_code', $params);
    $info = $response['result'];
    $client->setAccessToken($info['access_token']);
    $response = $client->fetch('https://eu.api.battle.net/wow/user/characters');
    
    var_dump($response);
}